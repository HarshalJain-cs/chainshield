import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Returns all liquidity pools from Convex (public, no auth needed).
 */
export function usePools() {
  const pools = useQuery(api.pools.getPools, {});
  return {
    pools: pools ?? [],
    isLoading: pools === undefined,
  };
}
