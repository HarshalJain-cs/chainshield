import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserNotifications = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    if (!walletAddress) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .order("desc")
      .collect();
  },
});

export const getUnreadCount = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .collect();
    return all.filter((n) => !n.isRead).length;
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress.toLowerCase()))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
    return { marked: unread.length };
  },
});

export const createNotification = mutation({
  args: {
    walletAddress: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    metadata: v.optional(v.any()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      walletAddress: args.walletAddress.toLowerCase(),
      type: args.type,
      title: args.title,
      body: args.body,
      isRead: false,
      metadata: args.metadata,
      actionUrl: args.actionUrl,
      createdAt: Date.now(),
    });
  },
});
