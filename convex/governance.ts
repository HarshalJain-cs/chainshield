import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getActiveProposals = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("governanceProposals")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();
    return active.filter((p) => p.votingEndsAt > now);
  },
});

export const getAllProposals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("governanceProposals")
      .order("desc")
      .collect();
  },
});

export const getProposalById = query({
  args: { proposalId: v.id("governanceProposals") },
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get(proposalId);
    if (!proposal) return null;

    // Attach top votes with reasons
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_proposal", (q) => q.eq("proposalId", proposalId))
      .collect();

    return { ...proposal, votes };
  },
});

export const getMyVote = query({
  args: { proposalId: v.id("governanceProposals"), voterWallet: v.string() },
  handler: async (ctx, { proposalId, voterWallet }) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterWallet", voterWallet.toLowerCase()))
      .filter((q) => q.eq(q.field("proposalId"), proposalId))
      .first();
    return votes ?? null;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

export const createProposal = mutation({
  args: {
    proposerWallet: v.string(),
    title: v.string(),
    description: v.string(),
    proposalType: v.union(
      v.literal("parameter_change"),
      v.literal("pool_management"),
      v.literal("coverage_type"),
      v.literal("contract_upgrade"),
      v.literal("treasury"),
      v.literal("other")
    ),
    votingDurationDays: v.optional(v.number()), // default 7
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const durationMs = (args.votingDurationDays ?? 7) * 24 * 60 * 60 * 1000;
    const votingStartsAt = now;
    const votingEndsAt = now + durationMs;

    return await ctx.db.insert("governanceProposals", {
      proposerWallet: args.proposerWallet.toLowerCase(),
      title: args.title,
      description: args.description,
      proposalType: args.proposalType,
      status: "Active",
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 4, // 4% of total supply
      votingStartsAt,
      votingEndsAt,
      createdAt: now,
    });
  },
});

export const castVote = mutation({
  args: {
    proposalId: v.id("governanceProposals"),
    voterWallet: v.string(),
    support: v.union(v.literal("for"), v.literal("against"), v.literal("abstain")),
    reason: v.optional(v.string()),
    weight: v.optional(v.number()), // CST balance; defaults to 1 in demo mode
  },
  handler: async (ctx, args) => {
    const wallet = args.voterWallet.toLowerCase();

    // Check proposal exists and is active
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "Active") throw new Error("Proposal is not active");
    if (proposal.votingEndsAt < Date.now()) throw new Error("Voting period has ended");

    // Prevent double voting
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterWallet", wallet))
      .filter((q) => q.eq(q.field("proposalId"), args.proposalId))
      .first();
    if (existing) throw new Error("You have already voted on this proposal");

    const weight = args.weight ?? 1;

    // Record vote
    await ctx.db.insert("votes", {
      proposalId: args.proposalId,
      voterWallet: wallet,
      support: args.support,
      weight,
      reason: args.reason,
      createdAt: Date.now(),
    });

    // Update tallies
    const patch: Partial<{ votesFor: number; votesAgainst: number; votesAbstain: number }> = {};
    if (args.support === "for") patch.votesFor = proposal.votesFor + weight;
    else if (args.support === "against") patch.votesAgainst = proposal.votesAgainst + weight;
    else patch.votesAbstain = proposal.votesAbstain + weight;
    await ctx.db.patch(args.proposalId, patch);
  },
});

export const executeProposal = mutation({
  args: { proposalId: v.id("governanceProposals"), txHash: v.optional(v.string()) },
  handler: async (ctx, { proposalId, txHash }) => {
    const proposal = await ctx.db.get(proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "Queued") throw new Error("Proposal is not queued for execution");
    if (proposal.timelockEndsAt && proposal.timelockEndsAt > Date.now()) {
      throw new Error("Timelock period has not ended");
    }
    await ctx.db.patch(proposalId, {
      status: "Executed",
      executedAt: Date.now(),
      txHash,
    });
  },
});

/** Transition proposals that have passed voting to Succeeded or Defeated */
export const finalizeExpiredProposals = mutation({
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
      const newStatus = passed ? "Succeeded" : "Defeated";
      await ctx.db.patch(p._id, {
        status: newStatus,
        ...(passed ? { timelockEndsAt: now + 2 * 24 * 60 * 60 * 1000 } : {}),
      });
      finalized++;
    }
    return { finalized };
  },
});
