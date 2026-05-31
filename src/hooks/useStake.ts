import { useState } from "react";
import { useMutation, useConvex } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import { useAppMode } from "@/hooks/useAppMode";
import type { Id } from "../../convex/_generated/dataModel";
import { stakeSchema } from "@/lib/validation";
import { sendTransaction, prepareContractCall, getContract, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { sepolia } from "thirdweb/chains";
import { insurancePoolContract, CONTRACT_ADDRESSES } from "@/lib/contracts/instances";
import { TOKEN_ADDRESSES } from "@/lib/contracts/addresses";
import { toast } from "sonner";

/**
 * Hook for staking (depositing) into a liquidity pool.
 */
export function useStake() {
  const account = useActiveAccount();
  const address = account?.address;
  const deposit = useMutation(api.lp.deposit);
  const { isDemo } = useAppMode();
  const convex = useConvex();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stake = async (
    poolDocId: Id<"pools">,
    amountUsd: number,
    token: string
  ) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      // Validate input
      stakeSchema.parse({ poolId: poolDocId, amountUsd, token });

      let resolvedTxHash: string;

      if (isDemo) {
        const result = await simulateTx("deposit", (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        });
        resolvedTxHash = result.txHash;
      } else {
        toast.info("Fetching pool details from database...");
        
        // 1. Retrieve the pool from Convex
        const pool = await convex.query(api.pools.getPoolById, { id: poolDocId });
        if (!pool) {
          throw new Error("Pool not found in database.");
        }
        
        const poolIdString = pool.poolId; // e.g. "pool-mixed"
        
        // 2. Resolve token address and decimals
        const tokenSymbol = token;
        const tokenAddress =
          tokenSymbol === "USDC"
            ? TOKEN_ADDRESSES.USDC
            : tokenSymbol === "DAI"
              ? TOKEN_ADDRESSES.DAI
              : TOKEN_ADDRESSES.ETH;
              
        if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error(`Token ${tokenSymbol} not supported on testnet.`);
        }

        const decimals = tokenSymbol === "USDC" ? 6 : 18;
        const amountUnits = BigInt(Math.floor(amountUsd * Math.pow(10, decimals)));

        // 3. ERC-20 Allowance check and Approval
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

        toast.info(`Checking staking token allowance for ${tokenSymbol}...`);
        const currentAllowance = await readContract({
          contract: erc20Contract,
          method: "allowance",
          params: [address, CONTRACT_ADDRESSES.INSURANCE_POOL]
        });

        if (currentAllowance < amountUnits) {
          toast.info(`Approving InsurancePool to spend ${amountUsd} ${tokenSymbol}...`);
          const approveTx = prepareContractCall({
            contract: erc20Contract,
            method: "approve",
            params: [CONTRACT_ADDRESSES.INSURANCE_POOL, amountUnits]
          });
          const approveResult = await sendTransaction({
            transaction: approveTx,
            account
          });
          console.log(`[Approval] Token spend approved. Tx Hash: ${approveResult.transactionHash}`);
          toast.success("Allowance approved successfully!");
        }

        // 4. Deposit liquidity to InsurancePool
        toast.info("Submitting liquidity staking transaction...");
        setTxStatus("confirming");

        const depositTx = prepareContractCall({
          contract: insurancePoolContract,
          method: "deposit",
          params: [poolIdString, amountUnits]
        });

        const depositResult = await sendTransaction({
          transaction: depositTx,
          account
        });

        resolvedTxHash = depositResult.transactionHash;
        setTxHash(resolvedTxHash);
        setTxStatus("success");
        toast.success("Liquidity staked successfully on-chain!");
      }

      await deposit({
        poolDocId,
        lpAddress: address,
        depositedAmountUsd: amountUsd,
        depositedToken: token,
        txHash: resolvedTxHash,
      });

      return { txHash: resolvedTxHash };
    } catch (err: any) {
      setError(err.message ?? "Deposit failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
  };

  return { stake, txStatus, txHash, error, reset };
}

/**
 * Hook for unstaking (withdrawing) from a liquidity pool.
 */
export function useUnstake() {
  const account = useActiveAccount();
  const address = account?.address;
  const withdraw = useMutation(api.lp.withdraw);
  const { isDemo } = useAppMode();
  const convex = useConvex();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unstake = async (positionId: Id<"lpPositions">) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      let resolvedTxHash: string;

      if (isDemo) {
        const result = await simulateTx("withdraw", (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        });
        resolvedTxHash = result.txHash;
      } else {
        toast.info("Fetching LP position details...");
        
        // 1. Retrieve the LP position from Convex
        const position = await convex.query(api.lp.getLPPositionById, { id: positionId });
        if (!position) {
          throw new Error("LP Position not found in database.");
        }

        // 2. Retrieve pool to get poolId string
        const pool = await convex.query(api.pools.getPoolById, { id: position.poolId });
        if (!pool) {
          throw new Error("Associated underwriting pool not found.");
        }

        const poolIdString = pool.poolId;

        // 3. Fetch pool info from contract to retrieve lpTokenAddress
        toast.info("Querying on-chain pool configurations...");
        const poolInfo = await readContract({
          contract: insurancePoolContract,
          method: "getPool",
          params: [poolIdString]
        });

        const lpTokenAddress = poolInfo.lpTokenAddress;

        if (!lpTokenAddress || lpTokenAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error("LP Share Token is not yet deployed for this pool.");
        }

        // 4. Retrieve on-chain LPToken balance for the user
        const lpTokenContract = getContract({
          client,
          chain: sepolia,
          address: lpTokenAddress,
          abi: [
            {
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }]
            }
          ]
        });

        toast.info("Reading your on-chain LP share balance...");
        const lpShareBalance = await readContract({
          contract: lpTokenContract,
          method: "balanceOf",
          params: [address]
        });

        if (lpShareBalance === 0n) {
          throw new Error("You have no on-chain LP shares to unstake for this pool.");
        }

        // 5. Submit withdrawal transaction
        toast.info("Submitting liquidity unstaking transaction...");
        setTxStatus("confirming");

        const withdrawTx = prepareContractCall({
          contract: insurancePoolContract,
          method: "withdraw",
          params: [poolIdString, lpShareBalance]
        });

        const withdrawResult = await sendTransaction({
          transaction: withdrawTx,
          account
        });

        resolvedTxHash = withdrawResult.transactionHash;
        setTxHash(resolvedTxHash);
        setTxStatus("success");
        toast.success("Liquidity unstaked successfully on-chain!");
      }

      await withdraw({ positionId, lpAddress: address });
      return { txHash: resolvedTxHash };
    } catch (err: any) {
      setError(err.message ?? "Withdrawal failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
  };

  return { unstake, txStatus, txHash, error, reset };
}
