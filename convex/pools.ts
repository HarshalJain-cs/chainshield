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
