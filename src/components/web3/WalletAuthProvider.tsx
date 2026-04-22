import { useEffect } from "react";
import { useConvexAuth } from "@/hooks/useConvexAuth";

/**
 * Invisible provider that syncs wallet → Convex on mount and wallet change.
 * Place inside WagmiProvider, outside everything else.
 */
export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  // Just calling the hook is enough; it uses useEffect internally
  useConvexAuth();
  return <>{children}</>;
}
