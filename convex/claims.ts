import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const claimStatus = v.union(
  v.literal("Submitted"),
  v.literal("Oracle check"),
  v.literal("Auto-approved"),
  v.literal("Manual review"),
  v.literal("Approved"),
  v.literal("Rejected"),
  v.literal("Paid")
);

export const getUserClaims = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    if (!walletAddress) return [];
    return await ctx.db
      .query("claims")
      .withIndex("by_claimant", (q) =>
        q.eq("claimant", walletAddress.toLowerCase())
      )
      .order("desc")
      .collect();
  },
});

export const getAllClaims = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("claims").order("desc").collect();
  },
});

export const getClaimsByStatus = query({
  args: { status: claimStatus },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .collect();
  },
});

export const getClaimById = query({
  args: { id: v.id("claims") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createClaim = mutation({
  args: {
    policyId: v.id("policies"),
    claimant: v.string(),
    claimType: v.string(),
    incidentType: v.string(),
    incidentDate: v.optional(v.string()),
    description: v.string(),
    requestedAmountUsd: v.number(),
    // DeFi
    incidentTxHash: v.optional(v.string()),
    affectedContract: v.optional(v.string()),
    protocolName: v.optional(v.string()),
    // Health
    providerName: v.optional(v.string()),
    treatmentFrom: v.optional(v.string()),
    treatmentTo: v.optional(v.string()),
    // Auto
    policeReport: v.optional(v.string()),
    repairEstimate: v.optional(v.number()),
    // Evidence
    evidenceCids: v.array(v.string()),
    txHashSubmitted: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("claims", {
      ...args,
      claimant: args.claimant.toLowerCase(),
      onchainClaimId: Math.floor(Math.random() * 9000) + 100,
      status: "Submitted",
      oracleVerdict: "n/a",
      votesFor: 0,
      votesAgainst: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Simulate oracle check transition after "submission"
    // (In real app, this would be triggered by Chainlink oracle)
    return id;
  },
});

export const updateClaimStatus = mutation({
  args: {
    id: v.id("claims"),
    status: claimStatus,
    reviewerNotes: v.optional(v.string()),
    approvedAmountUsd: v.optional(v.number()),
    oracleVerdict: v.optional(
      v.union(v.literal("pass"), v.literal("fail"), v.literal("n/a"))
    ),
    payoutTxHash: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const voteOnClaim = mutation({
  args: {
    id: v.id("claims"),
    vote: v.union(v.literal("for"), v.literal("against")),
  },
  handler: async (ctx, { id, vote }) => {
    const claim = await ctx.db.get(id);
    if (!claim) throw new Error("Claim not found");
    await ctx.db.patch(id, {
      votesFor: vote === "for" ? claim.votesFor + 1 : claim.votesFor,
      votesAgainst: vote === "against" ? claim.votesAgainst + 1 : claim.votesAgainst,
      updatedAt: Date.now(),
    });
  },
});
