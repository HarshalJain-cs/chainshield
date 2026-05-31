import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Syncs wallet connection state to Convex user store.
 * When a wallet connects, creates/upserts the user record in Convex
 * and records the login timestamp.
 *
 * Place this hook inside WalletAuthProvider which sits under ThirdwebProvider.
 */
export function useConvexAuth() {
  const account = useActiveAccount();
  const upsertUser = useMutation(api.users.upsertUser);
  const updateLastLogin = useMutation(api.users.updateLastLogin);

  const address = account?.address?.toLowerCase();
  const isConnected = !!account;

  useEffect(() => {
    if (!isConnected || !address) return;

    // Upsert user record (creates on first connect, no-ops on subsequent)
    upsertUser({ walletAddress: address }).catch(console.error);

    // Record login timestamp every session
    updateLastLogin({ walletAddress: address }).catch(console.error);
  }, [isConnected, address, upsertUser, updateLastLogin]);

  return { address, isConnected };
}
