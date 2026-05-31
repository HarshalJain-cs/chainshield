import { useState } from "react";
import { useMutation } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import { useAppMode } from "@/hooks/useAppMode";
import type { Id } from "../../convex/_generated/dataModel";
import { purchasePolicySchema } from "@/lib/validation";

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
      if (isDemo) {
        // Demo mode: simulate transaction
        const result = await simulateTx("purchasePolicy", (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        });
        txHash = result.txHash;
      } else {
        // Live mode: TODO Phase 3 — call PolicyManager.purchasePolicy() via Thirdweb
        throw new Error(
          "Live mode not yet configured. Smart contracts have not been deployed yet. " +
          "Set VITE_MODE=demo to use the simulation mode."
        );
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
