import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Syncs wallet connection state to Convex user store.
 * When a wallet connects, creates/upserts the user record in Convex.
 */
export function useConvexAuth() {
  const { address, isConnected } = useAccount();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isConnected && address) {
      upsertUser({ walletAddress: address }).catch(console.error);
    }
  }, [isConnected, address, upsertUser]);

  return { address, isConnected };
}
