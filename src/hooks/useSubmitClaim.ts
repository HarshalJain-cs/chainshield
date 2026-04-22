import { useState } from "react";
import { useMutation } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import type { Id } from "../../convex/_generated/dataModel";

export interface SubmitClaimParams {
  policyId: Id<"policies">;
  claimType: string;
  incidentType: string;
  incidentDate?: string;
  description: string;
  requestedAmountUsd: number;
  // DeFi
  incidentTxHash?: string;
  affectedContract?: string;
  protocolName?: string;
  // Health
  providerName?: string;
  treatmentFrom?: string;
  treatmentTo?: string;
  // Auto
  policeReport?: string;
  repairEstimate?: number;
}

/**
 * Handles claim submission:
 * 1. Simulate onchain tx (mock)
 * 2. Store claim in Convex with "Submitted" status
 * 3. Convex realtime will reflect status changes live
 */
export function useSubmitClaim() {
  const { address } = useAccount();
  const createClaim = useMutation(api.claims.createClaim);

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<Id<"claims"> | null>(null);

  const submit = async (params: SubmitClaimParams) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      // 1. Simulate tx
      const result = await simulateTx("submitClaim", (status, hash) => {
        setTxStatus(status);
        if (hash) setTxHash(hash);
      });

      // 2. Store in Convex
      const id = await createClaim({
        policyId: params.policyId,
        claimant: address,
        claimType: params.claimType,
        incidentType: params.incidentType,
        incidentDate: params.incidentDate,
        description: params.description,
        requestedAmountUsd: params.requestedAmountUsd,
        incidentTxHash: params.incidentTxHash,
        affectedContract: params.affectedContract,
        protocolName: params.protocolName,
        providerName: params.providerName,
        treatmentFrom: params.treatmentFrom,
        treatmentTo: params.treatmentTo,
        policeReport: params.policeReport,
        repairEstimate: params.repairEstimate,
        evidenceCids: [],
        txHashSubmitted: result.txHash,
      });

      setClaimId(id);
      return { txHash: result.txHash, claimId: id };
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
    setClaimId(null);
  };

  return { submit, txStatus, txHash, error, claimId, reset };
}
