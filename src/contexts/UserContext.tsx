import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = "policyholder" | "liquidity_provider" | "admin" | "reviewer";

interface UserContextValue {
  /** Raw Convex user record — null if not yet loaded or not connected */
  user: Doc<"users"> | null | undefined;
  /** Lower-cased wallet address from Thirdweb active account */
  address: string | undefined;
  /** True when a wallet is connected */
  isConnected: boolean;
  /** User's role — defaults to "policyholder" */
  role: UserRole;
  /** Convenience flags */
  isAdmin: boolean;
  isReviewer: boolean;
  /** True while the user record is being fetched for the first time */
  isLoading: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue>({
  user: undefined,
  address: undefined,
  isConnected: false,
  role: "policyholder",
  isAdmin: false,
  isReviewer: false,
  isLoading: false,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const address = account?.address?.toLowerCase();
  const isConnected = !!account;

  // Live-subscribe to user record in Convex (updates in real-time)
  const user = useQuery(
    api.users.getUser,
    address ? { walletAddress: address } : "skip"
  );

  const role: UserRole = (user?.role as UserRole) ?? "policyholder";
  const isAdmin = role === "admin";
  const isReviewer = role === "reviewer" || role === "admin";

  // isLoading: connected but Convex hasn't returned yet
  const isLoading = isConnected && !!address && user === undefined;

  const value = useMemo<UserContextValue>(
    () => ({
      user: user ?? null,
      address,
      isConnected,
      role,
      isAdmin,
      isReviewer,
      isLoading,
    }),
    [user, address, isConnected, role, isAdmin, isReviewer, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUser() {
  return useContext(UserContext);
}
