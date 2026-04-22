import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserPolicies = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    if (!walletAddress) return [];
    return await ctx.db
      .query("policies")
      .withIndex("by_policyholder", (q) =>
        q.eq("policyholder", walletAddress.toLowerCase())
      )
      .order("desc")
      .collect();
  },
});

export const getAllPolicies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("policies").order("desc").collect();
  },
});

export const getPolicyById = query({
  args: { id: v.id("policies") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createPolicy = mutation({
  args: {
    policyholder: v.string(),
    coverageType: v.union(
      v.literal("defi_smart_contract"),
      v.literal("defi_protocol_hack"),
      v.literal("defi_oracle_failure"),
      v.literal("health_basic"),
      v.literal("health_standard"),
      v.literal("health_premium"),
      v.literal("life_term"),
      v.literal("auto_liability"),
      v.literal("auto_full"),
      v.literal("auto_ev"),
      v.literal("finance_wallet"),
      v.literal("finance_cex"),
      v.literal("travel_basic"),
      v.literal("travel_medical")
    ),
    coverageAmountUsd: v.number(),
    premiumAmountUsd: v.number(),
    premiumToken: v.string(),
    paymentFrequency: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("one_time")
    ),
    autoRenew: v.boolean(),
    productId: v.string(),
    poolId: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    beneficiaries: v.optional(
      v.array(v.object({ name: v.string(), wallet: v.string(), share: v.number() }))
    ),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("policies", {
      ...args,
      policyholder: args.policyholder.toLowerCase(),
      onchainPolicyId: Math.floor(Math.random() * 9000) + 1000, // mock ID
      status: "active",
      createdAt: Date.now(),
    });

    // Ensure user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.policyholder.toLowerCase())
      )
      .first();

    if (!existing) {
      await ctx.db.insert("users", {
        walletAddress: args.policyholder.toLowerCase(),
        role: "policyholder",
        kycStatus: "none",
        isSuspended: false,
        totalCoverageUsd: args.coverageAmountUsd,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        totalCoverageUsd: existing.totalCoverageUsd + args.coverageAmountUsd,
      });
    }

    return id;
  },
});

export const updatePolicyStatus = mutation({
  args: {
    id: v.id("policies"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("claimed")
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});
