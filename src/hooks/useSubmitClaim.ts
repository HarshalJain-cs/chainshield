import { useState } from "react";
import { useMutation, useConvex } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import { useAppMode } from "@/hooks/useAppMode";
import type { Id } from "../../convex/_generated/dataModel";
import { submitClaimSchemaBase } from "@/lib/validation";
import { sendTransaction, prepareContractCall, prepareEvent, parseEventLogs } from "thirdweb";
import { claimsProcessorContract } from "@/lib/contracts/instances";
import { toast } from "sonner";

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
  const account = useActiveAccount();
  const address = account?.address;
  const createClaim = useMutation(api.claims.createClaim);
  const { isDemo } = useAppMode();
  const convex = useConvex();
 
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<Id<"claims"> | null>(null);
 
  const submit = async (params: SubmitClaimParams) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");
 
    try {
      // Validate input
      submitClaimSchemaBase.parse({
        policyId: params.policyId,
        claimType: params.claimType,
        incidentType: params.incidentType,
        description: params.description,
        requestedAmountUsd: params.requestedAmountUsd,
        incidentDate: params.incidentDate,
        incidentTxHash: params.incidentTxHash,
        affectedContract: params.affectedContract,
        protocolName: params.protocolName,
        providerName: params.providerName,
        treatmentFrom: params.treatmentFrom,
        treatmentTo: params.treatmentTo,
        policeReport: params.policeReport,
        repairEstimate: params.repairEstimate,
      });
 
      // 1. Get tx hash (demo: simulate; live: real contract call Phase 3)
      let resolvedTxHash: string;
      let parsedOnchainClaimId: number | undefined = undefined;
      
      if (isDemo) {
        const result = await simulateTx("submitClaim", (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        });
        resolvedTxHash = result.txHash;
      } else {
        setTxStatus("pending");
        toast.info("Fetching policy details from database...");
        
        // 1. Retrieve the policy from Convex to extract the onchainPolicyId
        const policy = await convex.query(api.policies.getPolicyById, { id: params.policyId });
        if (!policy) {
          throw new Error("Associated insurance policy could not be found in database.");
        }
        
        const onchainPolicyId = policy.onchainPolicyId ?? 1; // Fallback to 1 if missing for safety
        
        toast.info("Submitting insurance claim transaction on-chain...");
        setTxStatus("confirming");
        
        // 2. Prepare submitClaim contract call
        const claimTx = prepareContractCall({
          contract: claimsProcessorContract,
          method: "submitClaim",
          params: [
            BigInt(onchainPolicyId),
            BigInt(Math.floor(params.requestedAmountUsd)),
            params.incidentType,
            params.description,
            [], // evidence CIDs
            params.incidentTxHash || ""
          ]
        });
        
        const claimResult = await sendTransaction({
          transaction: claimTx,
          account
        });
        
        resolvedTxHash = claimResult.transactionHash;
        setTxHash(resolvedTxHash);
        
        // 3. Parse ClaimSubmitted event to get onchainClaimId
        try {
          const claimSubmittedEvent = prepareEvent({
            signature: "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed claimant, uint256 amount)"
          });
          const logs = parseEventLogs({
            logs: claimResult.logs,
            events: [claimSubmittedEvent]
          });
          if (logs.length > 0) {
            parsedOnchainClaimId = Number(logs[0].args.claimId);
            console.log(`[On-Chain Claim ID] Parsed claimId: ${parsedOnchainClaimId}`);
          }
        } catch (parseErr) {
          console.warn("Failed to parse ClaimSubmitted event log:", parseErr);
        }
        
        setTxStatus("success");
        toast.success("Insurance claim submitted successfully on-chain!");
      }
 
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
        txHashSubmitted: resolvedTxHash,
        onchainClaimId: parsedOnchainClaimId,
      });
 
      setClaimId(id);
      return { txHash: resolvedTxHash, claimId: id };
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
