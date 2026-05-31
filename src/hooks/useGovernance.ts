import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { useAppMode } from "./useAppMode";

/**
 * Hook for governance proposals and voting.
 * Demo mode: all operations hit Convex only (no blockchain).
 * Live mode: will call Governor contract (Phase 4 — placeholder for now).
 */
export function useGovernance() {
  const { address } = useUser();
  const { isDemo } = useAppMode();

  const proposals = useQuery(api.governance.getAllProposals);
  const activeProposals = useQuery(api.governance.getActiveProposals);

  const createProposalMutation = useMutation(api.governance.createProposal);
  const castVoteMutation = useMutation(api.governance.castVote);

  const createProposal = async (params: {
    title: string;
    description: string;
    proposalType: "parameter_change" | "pool_management" | "coverage_type" | "contract_upgrade" | "treasury" | "other";
    votingDurationDays?: number;
  }) => {
    if (!address) throw new Error("Wallet not connected");

    if (isDemo) {
      // Demo mode: store in Convex only
      return await createProposalMutation({
        proposerWallet: address,
        ...params,
      });
    } else {
      // Live mode: TODO Phase 4 — call Governor.propose() then sync to Convex
      throw new Error("Live governance not yet configured. Please use demo mode.");
    }
  };

  const castVote = async (params: {
    proposalId: string;
    support: "for" | "against" | "abstain";
    reason?: string;
  }) => {
    if (!address) throw new Error("Wallet not connected");

    if (isDemo) {
      return await castVoteMutation({
        proposalId: params.proposalId as any,
        voterWallet: address,
        support: params.support,
        reason: params.reason,
        weight: 1, // 1 vote in demo mode
      });
    } else {
      // Live mode: TODO Phase 4 — call Governor.castVote()
      throw new Error("Live governance not yet configured. Please use demo mode.");
    }
  };

  return {
    proposals: proposals ?? [],
    activeProposals: activeProposals ?? [],
    isLoading: proposals === undefined,
    createProposal,
    castVote,
  };
}
