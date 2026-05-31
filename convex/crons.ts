import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Internal Mutations (called by crons) ────────────────────────────────────

/** Mark policies past their endDate as expired */
export const expireOverduePolicies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const active = await ctx.db
      .query("policies")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let expired = 0;
    for (const policy of active) {
      if (policy.endDate < today && !policy.autoRenew) {
        await ctx.db.patch(policy._id, { status: "expired" });
        // Notify policyholder
        await ctx.db.insert("notifications", {
          walletAddress: policy.policyholder,
          type: "policy_expired",
          title: "Policy Expired",
          body: `Your policy (ID: ${policy._id}) has expired. Renew to maintain coverage.`,
          isRead: false,
          metadata: { policyId: policy._id },
          actionUrl: `/app`,
          createdAt: Date.now(),
        });
        expired++;
      }
    }
    return { expired };
  },
});

/** Create expiry reminders for policies expiring in 7 days or 1 day */
export const checkExpiringPolicies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    const sevenDaysFromNow = new Date(now + sevenDaysMs).toISOString().split("T")[0];
    const oneDayFromNow = new Date(now + oneDayMs).toISOString().split("T")[0];

    const active = await ctx.db
      .query("policies")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let notified = 0;
    for (const policy of active) {
      if (policy.endDate === sevenDaysFromNow || policy.endDate === oneDayFromNow) {
        const daysLeft = policy.endDate === sevenDaysFromNow ? 7 : 1;
        await ctx.db.insert("notifications", {
          walletAddress: policy.policyholder,
          type: "policy_expiring",
          title: `Policy Expiring in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`,
          body: `Your coverage expires on ${policy.endDate}. Enable auto-renew or purchase a new policy.`,
          isRead: false,
          metadata: { policyId: policy._id, daysLeft },
          actionUrl: `/app`,
          createdAt: Date.now(),
        });
        notified++;
      }
    }
    return { notified };
  },
});

/** Take a daily TVL/APY snapshot for each active pool */
export const snapshotYields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const date = new Date(now).toISOString().split("T")[0];

    const pools = await ctx.db.query("pools").collect();
    let count = 0;
    for (const pool of pools) {
      // Don't duplicate snapshots for same day
      const existing = await ctx.db
        .query("yieldSnapshots")
        .withIndex("by_pool", (q) => q.eq("poolId", pool._id))
        .filter((q) => q.eq(q.field("date"), date))
        .first();
      if (existing) continue;

      await ctx.db.insert("yieldSnapshots", {
        poolId: pool._id,
        date,
        apy: pool.apy,
        tvlUsd: pool.tvlUsd,
        utilizationPct: pool.utilizationPct,
        premiumCollectedUsd: pool.tvlUsd * (pool.apy / 100) / 365, // daily estimate
        createdAt: now,
      });
      count++;
    }
    return { count };
  },
});

/** Delete read notifications older than 30 days */
export const cleanupNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("notifications")
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), true),
          q.lt(q.field("createdAt"), cutoff)
        )
      )
      .collect();
    for (const n of stale) {
      await ctx.db.delete(n._id);
    }
    return { deleted: stale.length };
  },
});

/** Finalize governance proposals whose voting period ended */
export const finalizeGovernanceProposals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("governanceProposals")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    let finalized = 0;
    for (const p of active) {
      if (p.votingEndsAt > now) continue;
      const passed = p.votesFor > p.votesAgainst;
      await ctx.db.patch(p._id, {
        status: passed ? "Succeeded" : "Defeated",
        ...(passed ? { timelockEndsAt: now + 2 * 24 * 60 * 60 * 1000 } : {}),
      });
      finalized++;
    }
    return { finalized };
  },
});

// ─── Cron Schedule ───────────────────────────────────────────────────────────

const crons = cronJobs();

// Daily at 01:00 UTC
crons.daily(
  "expire-overdue-policies",
  { hourUTC: 1, minuteUTC: 0 },
  internal.crons.expireOverduePolicies
);

// Daily at 01:10 UTC
crons.daily(
  "check-expiring-policies",
  { hourUTC: 1, minuteUTC: 10 },
  internal.crons.checkExpiringPolicies
);

// Daily at 02:00 UTC
crons.daily(
  "snapshot-yields",
  { hourUTC: 2, minuteUTC: 0 },
  internal.crons.snapshotYields
);

// Weekly on Sunday at 03:00 UTC
crons.weekly(
  "cleanup-notifications",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.crons.cleanupNotifications
);

// Every hour — finalize governance proposals
crons.hourly(
  "finalize-governance",
  { minuteUTC: 30 },
  internal.crons.finalizeGovernanceProposals
);

export default crons;
