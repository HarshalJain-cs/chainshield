/**
 * Returns the current app mode from environment variables.
 *
 * VITE_MODE=demo  → simulated flows, no wallet/blockchain required
 * VITE_MODE=live  → real smart contract calls on Sepolia testnet
 *
 * Default is "demo" — the app always works without any blockchain setup.
 */
export function useAppMode() {
  const mode = (import.meta.env.VITE_MODE as string) ?? "demo";
  const isDemo = mode !== "live";
  const isLive = mode === "live";

  return {
    mode: isDemo ? "demo" : "live",
    isDemo,
    isLive,
  };
}
