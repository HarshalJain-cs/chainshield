import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPremiumHistory = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    if (!walletAddress) return [];
    return await ctx.db
      .query("premiums")
      .withIndex("by_payer", (q) => q.eq("payerAddress", walletAddress.toLowerCase()))
      .order("desc")
      .collect();
  },
});

export const recordPremium = mutation({
  args: {
    policyId: v.id("policies"),
    payerAddress: v.string(),
    amountUsd: v.number(),
    token: v.string(),
    periodStart: v.string(),
    periodEnd: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("premiums", {
      ...args,
      payerAddress: args.payerAddress.toLowerCase(),
      status: "Paid",
      paidAt: Date.now(),
    });
  },
});
