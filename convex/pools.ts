import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPools = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pools").collect();
  },
});

export const getPoolByPoolId = query({
  args: { poolId: v.string() },
  handler: async (ctx, { poolId }) => {
    return await ctx.db
      .query("pools")
      .withIndex("by_pool_id", (q) => q.eq("poolId", poolId))
      .first();
  },
});

export const getPoolById = query({
  args: { id: v.id("pools") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createPool = mutation({
  args: {
    poolId: v.string(),
    productId: v.string(),
    name: v.string(),
    poolType: v.union(
      v.literal("DeFi"),
      v.literal("Health"),
      v.literal("Auto"),
      v.literal("Life"),
      v.literal("Mixed")
    ),
    apy: v.number(),
    tvlUsd: v.number(),
    utilizationPct: v.number(),
    acceptedTokens: v.array(v.string()),
    riskLevel: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    lockPeriodDays: v.number(),
    contractAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Avoid duplicates
    const existing = await ctx.db
      .query("pools")
      .withIndex("by_pool_id", (q) => q.eq("poolId", args.poolId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("pools", {
      ...args,
      isActive: true,
      isAcceptingDeposits: true,
      createdAt: Date.now(),
    });
  },
});

export const updatePoolStats = mutation({
  args: {
    id: v.id("pools"),
    tvlUsd: v.optional(v.number()),
    utilizationPct: v.optional(v.number()),
    apy: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
  },
});

export const getPoolHistory = query({
  args: { poolId: v.id("pools"), days: v.optional(v.number()) },
  handler: async (ctx, { poolId, days = 30 }) => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const snapshots = await ctx.db
      .query("yieldSnapshots")
      .withIndex("by_pool", (q) => q.eq("poolId", poolId))
      .collect();
    return snapshots
      .filter((s) => s.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const calculateProjectedYield = query({
  args: {
    poolId: v.id("pools"),
    depositAmountUsd: v.number(),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, { poolId, depositAmountUsd, durationDays = 365 }) => {
    const pool = await ctx.db.get(poolId);
    if (!pool) return null;
    const dailyRate = pool.apy / 100 / 365;
    const projectedEarnings = depositAmountUsd * dailyRate * durationDays;
    return {
      depositAmountUsd,
      durationDays,
      projectedEarningsUsd: projectedEarnings,
      effectiveApy: pool.apy,
    };
  },
});
