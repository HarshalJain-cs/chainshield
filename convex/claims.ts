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

// ─── Queries ─────────────────────────────────────────────────────────────────

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

export const getClaimMessages = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    return await ctx.db
      .query("claimMessages")
      .withIndex("by_claim", (q) => q.eq("claimId", claimId))
      .order("asc")
      .collect();
  },
});

/** Returns the timeline of status changes from admin audit log */
export const getClaimTimeline = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim) return [];

    // Get admin actions for this claim
    const actions = await ctx.db
      .query("adminActions")
      .withIndex("by_action", (q) => q.eq("action", "approve_claim"))
      .filter((q) => q.eq(q.field("targetId"), claimId as string))
      .collect();

    const rejectActions = await ctx.db
      .query("adminActions")
      .withIndex("by_action", (q) => q.eq("action", "reject_claim"))
      .filter((q) => q.eq(q.field("targetId"), claimId as string))
      .collect();

    const allActions = [...actions, ...rejectActions].sort((a, b) => a.createdAt - b.createdAt);

    // Build timeline from claim data + actions
    const timeline = [
      { status: "Submitted", timestamp: claim.createdAt, label: "Claim submitted" },
    ];

    if (claim.reviewStartedAt) {
      timeline.push({ status: "Manual review", timestamp: claim.reviewStartedAt, label: "Assigned to reviewer" });
    }

    if (claim.reviewCompletedAt) {
      timeline.push({
        status: claim.status,
        timestamp: claim.reviewCompletedAt,
        label: claim.status === "Approved" ? "Claim approved" : "Claim rejected",
      });
    }

    return timeline;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

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
    onchainClaimId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { onchainClaimId, ...restArgs } = args;
    const id = await ctx.db.insert("claims", {
      ...restArgs,
      claimant: args.claimant.toLowerCase(),
      onchainClaimId: onchainClaimId ?? Math.floor(Math.random() * 9000) + 100,
      status: "Submitted",
      oracleVerdict: "n/a",
      votesFor: 0,
      votesAgainst: 0,
      createdAt: now,
      updatedAt: now,
    });
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

export const appealClaim = mutation({
  args: {
    claimId: v.id("claims"),
    claimantWallet: v.string(),
    appealReason: v.string(),
    newEvidenceCids: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { claimId, claimantWallet, appealReason, newEvidenceCids }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim) throw new Error("Claim not found");
    if (claim.status !== "Rejected") throw new Error("Only rejected claims can be appealed");
    if (claim.appealDeadline && claim.appealDeadline < Date.now()) {
      throw new Error("Appeal deadline has passed");
    }

    const now = Date.now();
    await ctx.db.patch(claimId, {
      status: "Manual review",
      decisionReason: undefined,
      reviewCompletedAt: undefined,
      updatedAt: now,
      ...(newEvidenceCids ? { evidenceCids: [...claim.evidenceCids, ...newEvidenceCids] } : {}),
    });

    // Add appeal message to thread
    await ctx.db.insert("claimMessages", {
      claimId,
      senderWallet: claimantWallet.toLowerCase(),
      senderRole: "claimant",
      message: `Appeal submitted: ${appealReason}`,
      createdAt: now,
    });
  },
});

export const addClaimMessage = mutation({
  args: {
    claimId: v.id("claims"),
    senderWallet: v.string(),
    senderRole: v.union(v.literal("claimant"), v.literal("reviewer"), v.literal("system")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("claimMessages", {
      claimId: args.claimId,
      senderWallet: args.senderWallet.toLowerCase(),
      senderRole: args.senderRole,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});
