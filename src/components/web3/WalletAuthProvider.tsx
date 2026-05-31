import { type ReactNode } from "react";
import { useConvexAuth } from "@/hooks/useConvexAuth";

/**
 * Invisible provider that syncs wallet → Convex on mount and wallet change.
 * Must be placed inside ThirdwebProvider and UserProvider.
 * The UserProvider handles the reactive user query; this handles the upsert side-effect.
 */
export function WalletAuthProvider({ children }: { children: ReactNode }) {
  // Calling the hook triggers the wallet→Convex sync side-effect
  useConvexAuth();
  return <>{children}</>;
}
