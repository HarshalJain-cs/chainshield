import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .first();
  },
});

export const upsertUser = mutation({
  args: {
    walletAddress: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, displayName }) => {
    const addr = walletAddress.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();

    if (existing) {
      if (displayName) {
        await ctx.db.patch(existing._id, { displayName });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      walletAddress: addr,
      displayName: displayName ?? undefined,
      role: "policyholder",
      kycStatus: "none",
      isSuspended: false,
      totalCoverageUsd: 0,
      createdAt: Date.now(),
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
