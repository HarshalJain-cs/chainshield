import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    const [allPolicies, allClaims, allPools, allUsers] = await Promise.all([
      ctx.db.query("policies").collect(),
      ctx.db.query("claims").collect(),
      ctx.db.query("pools").collect(),
      ctx.db.query("users").collect(),
    ]);

    const activePolicies = allPolicies.filter((p) => p.status === "active");
    const pendingClaims = allClaims.filter(
      (c) => c.status === "Submitted" || c.status === "Manual review"
    );
    const totalTvlUsd = allPools.reduce((sum, p) => sum + p.tvlUsd, 0);
    const totalCoverageUsd = activePolicies.reduce((sum, p) => sum + p.coverageAmountUsd, 0);

    // Revenue: sum of all premiums (approximated from policies)
    const premiums = await ctx.db.query("premiums").collect();
    const totalRevenue = premiums.reduce((sum, pr) => sum + pr.amountUsd, 0);

    // 30d revenue
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const revenue30d = premiums
      .filter((pr) => pr.paidAt > thirtyDaysAgo)
      .reduce((sum, pr) => sum + pr.amountUsd, 0);

    return {
      totalPolicies: allPolicies.length,
      activePolicies: activePolicies.length,
      totalClaims: allClaims.length,
      pendingClaimsCount: pendingClaims.length,
      totalTvlUsd,
      totalCoverageUsd,
      totalRevenue,
      revenue30d,
      totalUsers: allUsers.length,
      suspendedUsers: allUsers.filter((u) => u.isSuspended).length,
    };
  },
});

// ─── Claims Management ───────────────────────────────────────────────────────

export const getPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    const submitted = await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", "Submitted"))
      .order("desc")
      .collect();
    const manualReview = await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", "Manual review"))
      .order("desc")
      .collect();
    return [...submitted, ...manualReview].sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getAllClaimsAdmin = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    const results = await ctx.db.query("claims").order("desc").collect();
    const filtered = status ? results.filter((c) => c.status === status) : results;
    return limit ? filtered.slice(0, limit) : filtered;
  },
});

export const assignReviewer = mutation({
  args: {
    claimId: v.id("claims"),
    reviewerWallet: v.string(),
    adminWallet: v.string(),
  },
  handler: async (ctx, { claimId, reviewerWallet, adminWallet }) => {
    await ctx.db.patch(claimId, {
      assignedReviewer: reviewerWallet.toLowerCase(),
      status: "Manual review",
      reviewStartedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("adminActions", {
      adminWallet: adminWallet.toLowerCase(),
      action: "assign_reviewer",
      targetType: "claim",
      targetId: claimId,
      details: { reviewerWallet },
      createdAt: Date.now(),
    });
  },
});

export const reviewClaim = mutation({
  args: {
    claimId: v.id("claims"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    approvedAmountUsd: v.optional(v.number()),
    notes: v.string(),
    adminWallet: v.string(),
  },
  handler: async (ctx, { claimId, decision, approvedAmountUsd, notes, adminWallet }) => {
    const now = Date.now();
    const newStatus = decision === "approve" ? "Approved" : "Rejected";

    await ctx.db.patch(claimId, {
      status: newStatus,
      reviewerNotes: notes,
      decisionReason: notes,
      approvedAmountUsd: decision === "approve" ? approvedAmountUsd : undefined,
      reviewCompletedAt: now,
      // Set appeal deadline 7 days after rejection
      appealDeadline: decision === "reject" ? now + 7 * 24 * 60 * 60 * 1000 : undefined,
      updatedAt: now,
    });

    // Add system message to claim thread
    await ctx.db.insert("claimMessages", {
      claimId,
      senderWallet: adminWallet.toLowerCase(),
      senderRole: "reviewer",
      message: `Claim ${newStatus.toLowerCase()}: ${notes}`,
      createdAt: now,
    });

    // Log to audit trail
    await ctx.db.insert("adminActions", {
      adminWallet: adminWallet.toLowerCase(),
      action: decision === "approve" ? "approve_claim" : "reject_claim",
      targetType: "claim",
      targetId: claimId,
      details: { approvedAmountUsd, notes },
      createdAt: now,
    });

    // Notify claimant
    const claim = await ctx.db.get(claimId);
    if (claim) {
      await ctx.db.insert("notifications", {
        walletAddress: claim.claimant,
        type: "claim_update",
        title: `Claim ${newStatus}`,
        body: decision === "approve"
          ? `Your claim for $${approvedAmountUsd?.toLocaleString()} has been approved.`
          : `Your claim has been rejected. Reason: ${notes}`,
        isRead: false,
        metadata: { claimId },
        actionUrl: `/claims`,
        createdAt: now,
      });
    }
  },
});

// ─── User Management ─────────────────────────────────────────────────────────

export const suspendUser = mutation({
  args: {
    targetWallet: v.string(),
    isSuspended: v.boolean(),
    adminWallet: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { targetWallet, isSuspended, adminWallet, reason }) => {
    const addr = targetWallet.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { isSuspended });

    await ctx.db.insert("adminActions", {
      adminWallet: adminWallet.toLowerCase(),
      action: isSuspended ? "suspend_user" : "unsuspend_user",
      targetType: "user",
      targetId: user._id,
      details: { reason },
      createdAt: Date.now(),
    });
  },
});

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const getAuditLog = query({
  args: {
    limit: v.optional(v.number()),
    adminWallet: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, { limit, adminWallet, action }) => {
    let results = await ctx.db
      .query("adminActions")
      .order("desc")
      .collect();

    if (adminWallet) {
      results = results.filter((a) => a.adminWallet === adminWallet.toLowerCase());
    }
    if (action) {
      results = results.filter((a) => a.action === action);
    }

    return limit ? results.slice(0, limit) : results;
  },
});

// ─── Pool Management ─────────────────────────────────────────────────────────

export const updatePool = mutation({
  args: {
    poolId: v.id("pools"),
    isActive: v.optional(v.boolean()),
    isAcceptingDeposits: v.optional(v.boolean()),
    apy: v.optional(v.number()),
    adminWallet: v.string(),
  },
  handler: async (ctx, { poolId, adminWallet, ...updates }) => {
    const patch: Record<string, unknown> = {};
    if (updates.isActive !== undefined) patch.isActive = updates.isActive;
    if (updates.isAcceptingDeposits !== undefined) patch.isAcceptingDeposits = updates.isAcceptingDeposits;
    if (updates.apy !== undefined) patch.apy = updates.apy;

    await ctx.db.patch(poolId, patch);

    await ctx.db.insert("adminActions", {
      adminWallet: adminWallet.toLowerCase(),
      action: "update_pool",
      targetType: "pool",
      targetId: poolId,
      details: updates,
      createdAt: Date.now(),
    });
  },
});
