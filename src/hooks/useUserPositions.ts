import { useQuery } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "../../convex/_generated/api";

/**
 * Returns the connected wallet's LP positions with pool metadata.
 */
export function useUserPositions() {
  const { address } = useAccount();
  const positions = useQuery(
    api.lp.getUserPositions,
    address ? { walletAddress: address } : "skip"
  );
  return {
    positions: positions ?? [],
    isLoading: positions === undefined && !!address,
  };
}
