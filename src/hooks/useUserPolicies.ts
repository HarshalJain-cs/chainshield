import { useQuery } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";

/**
 * Returns all policies for the connected wallet.
 * Falls back to empty array when wallet not connected.
 */
export function useUserPolicies() {
  const account = useActiveAccount();
  const address = account?.address;
  const policies = useQuery(
    api.policies.getUserPolicies,
    address ? { walletAddress: address } : "skip"
  );
  return {
    policies: policies ?? [],
    isLoading: policies === undefined && !!address,
  };
}
