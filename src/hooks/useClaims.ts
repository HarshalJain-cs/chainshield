import { useQuery } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";

/**
 * Returns claims for the connected wallet.
 * Convex automatically re-renders when claim status changes (realtime).
 */
export function useUserClaims() {
  const account = useActiveAccount();
  const address = account?.address;
  const claims = useQuery(
    api.claims.getUserClaims,
    address ? { walletAddress: address } : "skip"
  );
  return {
    claims: claims ?? [],
    isLoading: claims === undefined && !!address,
  };
}

/**
 * Returns ALL claims (for governance/assessment view).
 */
export function useAllClaims() {
  const claims = useQuery(api.claims.getAllClaims, {});
  return {
    claims: claims ?? [],
    isLoading: claims === undefined,
  };
}
