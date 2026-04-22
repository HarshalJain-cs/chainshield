import { useQuery } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "../../convex/_generated/api";

/**
 * Returns all policies for the connected wallet.
 * Falls back to empty array when wallet not connected.
 */
export function useUserPolicies() {
  const { address } = useAccount();
  const policies = useQuery(
    api.policies.getUserPolicies,
    address ? { walletAddress: address } : "skip"
  );
  return {
    policies: policies ?? [],
    isLoading: policies === undefined && !!address,
  };
}
