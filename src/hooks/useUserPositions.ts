import { useQuery } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";

/**
 * Returns the connected wallet's LP positions with pool metadata.
 */
export function useUserPositions() {
  const account = useActiveAccount();
  const address = account?.address;
  const positions = useQuery(
    api.lp.getUserPositions,
    address ? { walletAddress: address } : "skip"
  );
  return {
    positions: positions ?? [],
    isLoading: positions === undefined && !!address,
  };
}
