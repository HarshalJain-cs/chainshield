import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserPositions = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    if (!walletAddress) return [];
    const positions = await ctx.db
      .query("lpPositions")
      .withIndex("by_lp", (q) => q.eq("lpAddress", walletAddress.toLowerCase()))
      .collect();

    // Enrich with pool data
    const enriched = await Promise.all(
      positions.map(async (pos) => {
        const pool = await ctx.db.get(pos.poolId);
        return { ...pos, pool };
      })
    );
    return enriched.filter((p) => p.isActive);
  },
});

export const deposit = mutation({
  args: {
    poolDocId: v.id("pools"),
    lpAddress: v.string(),
    depositedAmountUsd: v.number(),
    depositedToken: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolDocId);
    if (!pool) throw new Error("Pool not found");
    if (!pool.isAcceptingDeposits) throw new Error("Pool not accepting deposits");

    const addr = args.lpAddress.toLowerCase();

    // Check existing position
    const existing = await ctx.db
      .query("lpPositions")
      .withIndex("by_lp", (q) => q.eq("lpAddress", addr))
      .filter((q) => q.eq(q.field("poolId"), args.poolDocId))
      .first();

    const lpShares =
      pool.tvlUsd === 0 ? args.depositedAmountUsd : (args.depositedAmountUsd / pool.tvlUsd) * 1000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        depositedAmountUsd: existing.depositedAmountUsd + args.depositedAmountUsd,
        lpShares: existing.lpShares + lpShares,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("lpPositions", {
        poolId: args.poolDocId,
        lpAddress: addr,
        depositedAmountUsd: args.depositedAmountUsd,
        depositedToken: args.depositedToken,
        lpShares,
        totalEarnedUsd: 0,
        isActive: true,
        depositTxHash: args.txHash,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update pool TVL
    await ctx.db.patch(args.poolDocId, {
      tvlUsd: pool.tvlUsd + args.depositedAmountUsd,
    });
  },
});

export const withdraw = mutation({
  args: {
    positionId: v.id("lpPositions"),
    lpAddress: v.string(),
  },
  handler: async (ctx, { positionId, lpAddress }) => {
    const pos = await ctx.db.get(positionId);
    if (!pos) throw new Error("Position not found");
    if (pos.lpAddress !== lpAddress.toLowerCase()) throw new Error("Unauthorized");

    const pool = await ctx.db.get(pos.poolId);
    if (pool) {
      await ctx.db.patch(pos.poolId, {
        tvlUsd: Math.max(0, pool.tvlUsd - pos.depositedAmountUsd),
      });
    }

    await ctx.db.patch(positionId, { isActive: false, updatedAt: Date.now() });
  },
});
