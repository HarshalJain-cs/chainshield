import { useState } from "react";
import { useMutation } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import type { Id } from "../../convex/_generated/dataModel";

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
  const { address } = useAccount();
  const createPolicy = useMutation(api.policies.createPolicy);
  const recordPremium = useMutation(api.premiums.recordPremium);

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policyId, setPolicyId] = useState<Id<"policies"> | null>(null);

  const purchase = async (params: PurchasePolicyParams) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      // 1. Simulate onchain tx
      const result = await simulateTx("purchasePolicy", (status, hash) => {
        setTxStatus(status);
        if (hash) setTxHash(hash);
      });

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
        txHash: result.txHash,
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
        txHash: result.txHash,
      });

      return { txHash: result.txHash, policyId: id };
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
