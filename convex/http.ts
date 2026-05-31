import { httpRouter } from "convex/server";
import { httpAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Verifies Web2 signature for Alchemy webhooks
async function verifyAlchemySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const bodyBuffer = encoder.encode(body);
    const sigBuffer = hexToBytes(signature);
    return await crypto.subtle.verify("HMAC", key, sigBuffer, bodyBuffer);
  } catch (err) {
    console.error("[Webhook Verification Error]", err);
    return false;
  }
}

// ─── Internal Mutations ───────────────────────────────────────────────────────

/** Store a raw blockchain event — called by the Alchemy webhook handler */
export const storeBlockchainEvent = internalMutation({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    eventName: v.string(),
    txHash: v.string(),
    blockNumber: v.number(),
    logIndex: v.number(),
    args: v.any(),
  },
  handler: async (ctx, eventData) => {
    // De-duplicate by txHash + logIndex
    const existing = await ctx.db
      .query("blockchainEvents")
      .withIndex("by_tx", (q) => q.eq("txHash", eventData.txHash))
      .filter((q) => q.eq(q.field("logIndex"), eventData.logIndex))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("blockchainEvents", {
      ...eventData,
      processed: false,
      createdAt: Date.now(),
    });
  },
});

// ─── HTTP Router ──────────────────────────────────────────────────────────────

const http = httpRouter();

/**
 * Health check endpoint — used to verify Convex HTTP is reachable.
 * GET /health
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", service: "chainshield-convex" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * Alchemy Notify webhook receiver — indexes on-chain events into Convex.
 * POST /events/alchemy
 *
 * To set up: Create an Alchemy Notify webhook pointing to:
 *   https://<your-convex-deployment>.convex.site/events/alchemy
 * Monitor contract addresses: PolicyManager, ClaimsProcessor, InsurancePool
 */
http.route({
  path: "/events/alchemy",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.ALCHEMY_WEBHOOK_SECRET;
    const bodyText = await request.text();

    // Verify signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get("x-alchemy-signature");
      if (!signature) {
        return new Response("Unauthorized", { status: 401 });
      }
      const isValid = await verifyAlchemySignature(bodyText, signature, webhookSecret);
      if (!isValid) {
        return new Response("Invalid signature", { status: 403 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Process each activity in the webhook payload
    const activities: any[] = payload?.event?.activity ?? [];
    let processed = 0;

    for (const activity of activities) {
      try {
        const chainId = payload?.event?.network === "ETH_SEPOLIA" ? 11155111 : 1;

        await ctx.runMutation(internal.http.storeBlockchainEvent, {
          chainId,
          contractAddress: (activity.toAddress ?? "").toLowerCase(),
          eventName: activity.category ?? "unknown",
          txHash: activity.hash ?? "",
          blockNumber: Number(activity.blockNum ?? 0),
          logIndex: 0,
          args: activity,
        });
        processed++;
      } catch (err) {
        console.error("Failed to store blockchain event:", err);
      }
    }

    return new Response(JSON.stringify({ received: true, processed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
