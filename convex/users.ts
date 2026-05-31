import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getUser = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .first();
  },
});

export const getUserRole = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .first();
    return user?.role ?? "policyholder";
  },
});

export const getUserProfile = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const addr = walletAddress.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (!user) return null;

    // Count active policies
    const policies = await ctx.db
      .query("policies")
      .withIndex("by_policyholder", (q) => q.eq("policyholder", addr))
      .collect();
    const activePolicies = policies.filter((p) => p.status === "active");

    // Count claims
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_claimant", (q) => q.eq("claimant", addr))
      .collect();

    // Sum LP earnings
    const lpPositions = await ctx.db
      .query("lpPositions")
      .withIndex("by_lp", (q) => q.eq("lpAddress", addr))
      .collect();
    const totalEarnedUsd = lpPositions.reduce((sum, p) => sum + p.totalEarnedUsd, 0);

    return {
      ...user,
      stats: {
        activePolicyCount: activePolicies.length,
        totalPolicyCount: policies.length,
        claimCount: claims.length,
        totalEarnedUsd,
      },
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

export const upsertUser = mutation({
  args: {
    walletAddress: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, displayName, email }) => {
    const addr = walletAddress.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();

    if (existing) {
      // Update display name or email if provided and not already set
      const patch: Record<string, unknown> = {};
      if (displayName && !existing.displayName) patch.displayName = displayName;
      if (email && !existing.email) patch.email = email;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      walletAddress: addr,
      displayName: displayName ?? undefined,
      email: email ?? undefined,
      role: "policyholder",
      kycStatus: "none",
      isSuspended: false,
      totalCoverageUsd: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateLastLogin = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const addr = walletAddress.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }
  },
});

export const updateProfile = mutation({
  args: {
    walletAddress: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, ...updates }) => {
    const addr = walletAddress.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (!user) throw new Error("User not found");
    const patch: Record<string, unknown> = {};
    if (updates.displayName !== undefined) patch.displayName = updates.displayName;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.avatarUrl !== undefined) patch.avatarUrl = updates.avatarUrl;
    await ctx.db.patch(user._id, patch);
  },
});

/** Admin-only: change a user's role */
export const setUserRole = mutation({
  args: {
    targetWallet: v.string(),
    role: v.union(
      v.literal("policyholder"),
      v.literal("liquidity_provider"),
      v.literal("admin"),
      v.literal("reviewer")
    ),
  },
  handler: async (ctx, { targetWallet, role }) => {
    const addr = targetWallet.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { role });
  },
});

/** Admin-only: suspend / unsuspend a user */
export const setSuspended = mutation({
  args: {
    targetWallet: v.string(),
    isSuspended: v.boolean(),
  },
  handler: async (ctx, { targetWallet, isSuspended }) => {
    const addr = targetWallet.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { isSuspended });
  },
});

/**
 * One-time seed: promotes a wallet to admin.
 * Only works if no admins exist yet OR if caller is already admin.
 * Use from Convex dashboard: npx convex run users:seedAdmin --wallet 0x...
 */
export const seedAdmin = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const addr = walletAddress.toLowerCase();
    const existingAdmins = await ctx.db.query("users").collect();
    const hasAdmin = existingAdmins.some((u) => u.role === "admin");

    // Allow only if no admin exists
    if (hasAdmin) {
      throw new Error("An admin already exists. Use setUserRole from an admin account.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", addr))
      .first();

    if (!user) {
      // Create the user as admin
      return await ctx.db.insert("users", {
        walletAddress: addr,
        role: "admin",
        kycStatus: "approved",
        isSuspended: false,
        totalCoverageUsd: 0,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(user._id, { role: "admin" });
    return user._id;
  },
});
