import { query, mutation, internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
    // When true (demo mode), the claim is run through a simulated oracle +
    // auto-approval pipeline via scheduled functions so the lifecycle is
    // observable in realtime. Defaults to true.
    simulate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { onchainClaimId, simulate, ...restArgs } = args;
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

    // System message on the claim thread
    await ctx.db.insert("claimMessages", {
      claimId: id,
      senderWallet: "system",
      senderRole: "system",
      message: "Claim received and queued for verification.",
      createdAt: now,
    });

    // Notify the claimant
    await ctx.db.insert("notifications", {
      walletAddress: args.claimant.toLowerCase(),
      type: "claim_update",
      title: "Claim submitted",
      body: "Your claim has been received and is now being verified.",
      isRead: false,
      metadata: { claimId: id },
      actionUrl: "/claims",
      createdAt: now,
    });

    // Demo simulation: drive the claim through the oracle pipeline.
    if (simulate !== false) {
      await ctx.scheduler.runAfter(6000, internal.claims.runDemoOracleCheck, { claimId: id });
    }

    return id;
  },
});

// ─── Demo Oracle Simulation (scheduled) ──────────────────────────────────────

const AUTO_APPROVE_THRESHOLD_USD = 5_000;

/** Step 1: move claim into oracle verification and compute a verdict. */
export const runDemoOracleCheck = internalMutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim || claim.status !== "Submitted") return;

    const now = Date.now();
    const isDeFi = claim.claimType.toLowerCase().includes("defi");

    // Non-DeFi claims can't be verified by the on-chain oracle.
    const verdict: "pass" | "fail" | "n/a" = isDeFi
      ? Math.random() < 0.8
        ? "pass"
        : "fail"
      : "n/a";

    await ctx.db.patch(claimId, {
      status: "Oracle check",
      oracleVerdict: verdict,
      updatedAt: now,
    });

    await ctx.db.insert("claimMessages", {
      claimId,
      senderWallet: "system",
      senderRole: "system",
      message: isDeFi
        ? `Oracle verification in progress for ${claim.protocolName ?? "the affected protocol"}.`
        : "Routing claim to a human reviewer (off-chain evidence required).",
      createdAt: now,
    });

    await ctx.scheduler.runAfter(6000, internal.claims.resolveDemoOracle, { claimId });
  },
});

/** Step 2: resolve the verdict into auto-approval or manual review. */
export const resolveDemoOracle = internalMutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim || claim.status !== "Oracle check") return;

    const now = Date.now();
    const isDeFi = claim.claimType.toLowerCase().includes("defi");
    const confirmed = claim.oracleVerdict === "pass";
    const small = claim.requestedAmountUsd < AUTO_APPROVE_THRESHOLD_USD;

    if (isDeFi && confirmed && small) {
      // Auto-approve small, oracle-confirmed DeFi claims.
      await ctx.db.patch(claimId, {
        status: "Auto-approved",
        approvedAmountUsd: claim.requestedAmountUsd,
        decisionReason: "Oracle confirmed the incident and the amount is below the auto-approval threshold.",
        reviewCompletedAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("claimMessages", {
        claimId,
        senderWallet: "system",
        senderRole: "system",
        message: `Auto-approved for $${claim.requestedAmountUsd.toLocaleString()}. Payout is being processed.`,
        createdAt: now,
      });
      await notifyClaimant(ctx, claim.claimant, claimId, "Claim auto-approved", "Your claim was approved automatically. Payout is on the way.");
      await ctx.scheduler.runAfter(5000, internal.claims.payoutDemoClaim, { claimId });
    } else {
      // Everything else goes to a human reviewer.
      const reason = !isDeFi
        ? "Off-chain claim requires manual review."
        : !confirmed
          ? "Oracle could not confirm the incident; escalating to manual review."
          : "Claim amount exceeds the auto-approval threshold; escalating to manual review.";
      await ctx.db.patch(claimId, {
        status: "Manual review",
        reviewStartedAt: now,
        appealDeadline: now + 14 * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      await ctx.db.insert("claimMessages", {
        claimId,
        senderWallet: "system",
        senderRole: "system",
        message: reason,
        createdAt: now,
      });
      await notifyClaimant(ctx, claim.claimant, claimId, "Claim under review", reason);
    }
  },
});

/** Step 3: mark an auto-approved claim as paid. */
export const payoutDemoClaim = internalMutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim || claim.status !== "Auto-approved") return;

    const now = Date.now();
    const payoutTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    await ctx.db.patch(claimId, {
      status: "Paid",
      payoutTxHash,
      updatedAt: now,
    });

    // Mark the underlying policy as claimed.
    const policy = await ctx.db.get(claim.policyId);
    if (policy && policy.status === "active") {
      await ctx.db.patch(claim.policyId, { status: "claimed" });
    }

    await ctx.db.insert("claimMessages", {
      claimId,
      senderWallet: "system",
      senderRole: "system",
      message: `Payout of $${(claim.approvedAmountUsd ?? claim.requestedAmountUsd).toLocaleString()} sent. Tx: ${payoutTxHash.slice(0, 10)}…`,
      createdAt: now,
    });
    await notifyClaimant(ctx, claim.claimant, claimId, "Payout sent", "Your claim payout has been transferred to your wallet.");
  },
});

async function notifyClaimant(
  ctx: MutationCtx,
  claimant: string,
  claimId: Id<"claims">,
  title: string,
  body: string
) {
  await ctx.db.insert("notifications", {
    walletAddress: claimant.toLowerCase(),
    type: "claim_update",
    title,
    body,
    isRead: false,
    metadata: { claimId },
    actionUrl: "/claims",
    createdAt: Date.now(),
  });
}

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
