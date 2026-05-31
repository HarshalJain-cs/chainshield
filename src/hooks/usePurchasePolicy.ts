import { useState } from "react";
import { useMutation } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import { useAppMode } from "@/hooks/useAppMode";
import type { Id } from "../../convex/_generated/dataModel";
import { purchasePolicySchema } from "@/lib/validation";
import { sendTransaction, prepareContractCall, getContract, readContract, prepareEvent, parseEventLogs } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { sepolia } from "thirdweb/chains";
import { policyManagerContract, CONTRACT_ADDRESSES } from "@/lib/contracts/instances";
import { TOKEN_ADDRESSES } from "@/lib/contracts/addresses";
import { toast } from "sonner";

export interface PurchasePolicyParams {
  coverageType: string;
  coverageAmountUsd: number;
  premiumAmountUsd: number;
  premiumToken: string;
  paymentFrequency: "monthly" | "quarterly" | "yearly" | "one_time";
  autoRenew: boolean;
  productId: string;
  poolId?: string;
  durationMonths: number;
  beneficiaries?: { name: string; wallet: string; share: number }[];
}

/**
 * Handles the full policy purchase flow:
 * 1. Simulate onchain tx (mock)
 * 2. Store policy in Convex
 * 3. Record first premium payment
 */
export function usePurchasePolicy() {
  const account = useActiveAccount();
  const address = account?.address;
  const createPolicy = useMutation(api.policies.createPolicy);
  const recordPremium = useMutation(api.premiums.recordPremium);
  const { isDemo } = useAppMode();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policyId, setPolicyId] = useState<Id<"policies"> | null>(null);

  const purchase = async (params: PurchasePolicyParams) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      // Validate input
      const validated = purchasePolicySchema.parse(params);

      let txHash: string;
      let parsedOnchainPolicyId: number | undefined = undefined;
      if (isDemo) {
        // Demo mode: simulate transaction
        const result = await simulateTx("purchasePolicy", (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        });
        txHash = result.txHash;
      } else {
        // Live mode: Call PolicyManager.purchasePolicy() via Thirdweb
        setTxStatus("pending");
        
        // 1. Resolve premium token address
        const tokenSymbol = params.premiumToken;
        const tokenAddress =
          tokenSymbol === "USDC"
            ? TOKEN_ADDRESSES.USDC
            : tokenSymbol === "DAI"
              ? TOKEN_ADDRESSES.DAI
              : TOKEN_ADDRESSES.ETH;
              
        if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error(`Payment with native or unsupported token (${tokenSymbol}) not configured on testnet.`);
        }

        // Calculate decimals and units
        const decimals = tokenSymbol === "USDC" ? 6 : 18;
        const premiumAmountUnits = BigInt(Math.floor(params.premiumAmountUsd * Math.pow(10, decimals)));
        
        // 2. Perform ERC-20 Allowance check and Approval if necessary
        const erc20Contract = getContract({
          client,
          chain: sepolia,
          address: tokenAddress,
          abi: [
            {
              name: "allowance",
              type: "function",
              stateMutability: "view",
              inputs: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" }
              ],
              outputs: [{ name: "", type: "uint256" }]
            },
            {
              name: "approve",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" }
              ],
              outputs: [{ name: "", type: "bool" }]
            }
          ]
        });

        toast.info(`Checking premium token allowance for ${tokenSymbol}...`);
        const currentAllowance = await readContract({
          contract: erc20Contract,
          method: "allowance",
          params: [address, CONTRACT_ADDRESSES.POLICY_MANAGER]
        });

        if (currentAllowance < premiumAmountUnits) {
          toast.info(`Approving PolicyManager to spend ${params.premiumAmountUsd} ${tokenSymbol}...`);
          const approveTx = prepareContractCall({
            contract: erc20Contract,
            method: "approve",
            params: [CONTRACT_ADDRESSES.POLICY_MANAGER, premiumAmountUnits]
          });
          const approveResult = await sendTransaction({
            transaction: approveTx,
            account
          });
          console.log(`[Approval] Token spend approved. Tx Hash: ${approveResult.transactionHash}`);
          toast.success("Allowance approved successfully!");
        }

        // 3. Purchase Policy
        toast.info("Submitting policy purchase transaction...");
        setTxStatus("confirming");

        const purchaseTx = prepareContractCall({
          contract: policyManagerContract,
          method: "purchasePolicy",
          params: [
            address,
            params.productId,
            BigInt(Math.floor(params.coverageAmountUsd)),
            BigInt(Math.floor(params.durationMonths * 30)),
            tokenAddress,
            params.poolId || "pool-mixed"
          ]
        });

        const purchaseResult = await sendTransaction({
          transaction: purchaseTx,
          account
        });

        txHash = purchaseResult.transactionHash as `0x${string}`;
        setTxHash(txHash);

        // Parse PolicyCreated event to get the onchainPolicyId
        try {
          const policyCreatedEvent = prepareEvent({
            signature: "event PolicyCreated(uint256 indexed policyId, address indexed policyholder, string productId, uint256 coverageAmount, uint256 premiumAmount, uint256 endDate)"
          });
          const logs = parseEventLogs({
            logs: purchaseResult.logs,
            events: [policyCreatedEvent]
          });
          if (logs.length > 0) {
            parsedOnchainPolicyId = Number(logs[0].args.policyId);
            console.log(`[On-Chain Policy ID] Parsed policyId: ${parsedOnchainPolicyId}`);
          }
        } catch (parseErr) {
          console.warn("Failed to parse PolicyCreated log:", parseErr);
        }

        setTxStatus("success");
        toast.success("Policy purchased successfully on-chain!");
      }

      // 2. Calculate dates
      const startDate = new Date().toISOString().split("T")[0];
      const endMs =
        new Date().getTime() + params.durationMonths * 30 * 24 * 60 * 60 * 1000;
      const endDate = new Date(endMs).toISOString().split("T")[0];

      // 3. Store in Convex
      const id = await createPolicy({
        policyholder: address,
        coverageType: params.coverageType as any,
        coverageAmountUsd: params.coverageAmountUsd,
        premiumAmountUsd: params.premiumAmountUsd,
        premiumToken: params.premiumToken,
        paymentFrequency: params.paymentFrequency,
        autoRenew: params.autoRenew,
        productId: params.productId,
        poolId: params.poolId,
        startDate,
        endDate,
        beneficiaries: params.beneficiaries,
        txHash,
        onchainPolicyId: parsedOnchainPolicyId,
      });
      setPolicyId(id);

      // 4. Record first premium
      await recordPremium({
        policyId: id,
        payerAddress: address,
        amountUsd: params.premiumAmountUsd,
        token: params.premiumToken,
        periodStart: startDate,
        periodEnd: new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        txHash,
      });

      return { txHash, policyId: id };
    } catch (err: any) {
      setError(err.message ?? "Transaction failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
    setPolicyId(null);
  };

  return { purchase, txStatus, txHash, error, policyId, reset };
}
