import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getProductById = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_product_id", (q) => q.eq("productId", productId))
      .first();
  },
});

export const getProductsByLine = query({
  args: { coverageLine: v.string() },
  handler: async (ctx, { coverageLine }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_coverage_line", (q) => q.eq("coverageLine", coverageLine))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// ─── Seed (one-time migration from mock data) ────────────────────────────────

export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return { ok: true, message: "Products already seeded" };

    const now = Date.now();

    const products = [
      // ── DeFi ──
      {
        productId: "aave",
        name: "Aave Protocol Cover",
        slug: "aave",
        description: "Smart contract coverage for Aave v3 deposits and lending positions.",
        coverageLine: "DeFi",
        coverageType: "defi_smart_contract",
        minCoverageUsd: 1_000,
        maxCoverageUsd: 500_000,
        basePremiumPct: 2.1,
        features: [
          "Smart contract exploit coverage",
          "Oracle manipulation events",
          "Governance attack protection",
          "Up to $500K coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 1,
      },
      {
        productId: "uniswap",
        name: "Uniswap V3 Cover",
        slug: "uniswap",
        description: "Comprehensive protection for Uniswap V3 LP positions.",
        coverageLine: "DeFi",
        coverageType: "defi_smart_contract",
        minCoverageUsd: 500,
        maxCoverageUsd: 250_000,
        basePremiumPct: 1.8,
        features: [
          "LP position protection",
          "Contract exploit coverage",
          "MEV sandwich attack coverage",
          "Up to $250K coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 2,
      },
      {
        productId: "lido",
        name: "Lido Staking Cover",
        slug: "lido",
        description: "Protect stETH holdings from slashing and validator failures.",
        coverageLine: "DeFi",
        coverageType: "defi_oracle_failure",
        minCoverageUsd: 1_000,
        maxCoverageUsd: 1_000_000,
        basePremiumPct: 2.6,
        features: [
          "Validator slashing events",
          "Oracle failure coverage",
          "Smart contract exploits",
          "Up to $1M coverage",
        ],
        riskLevel: "Medium" as const,
        isActive: true,
        sortOrder: 3,
      },
      // ── Health ──
      {
        productId: "health-basic",
        name: "Health Basic",
        slug: "health-basic",
        description: "Essential health coverage for common medical events, paid in crypto.",
        coverageLine: "Health",
        coverageType: "health_basic",
        minCoverageUsd: 10_000,
        maxCoverageUsd: 100_000,
        basePremiumPct: 0.8,
        features: [
          "Hospitalization coverage",
          "Emergency procedures",
          "Outpatient visits",
          "Pharmacy benefits",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 10,
      },
      {
        productId: "health-std",
        name: "Health Standard",
        slug: "health-standard",
        description: "Comprehensive health insurance with enhanced coverage limits.",
        coverageLine: "Health",
        coverageType: "health_standard",
        minCoverageUsd: 50_000,
        maxCoverageUsd: 500_000,
        basePremiumPct: 0.6,
        features: [
          "Full hospitalization",
          "Specialist consultations",
          "Mental health coverage",
          "Dental & vision",
          "Up to $500K coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 11,
      },
      // ── Auto ──
      {
        productId: "auto-liability",
        name: "Auto Liability",
        slug: "auto-liability",
        description: "Third-party liability coverage for vehicle accidents.",
        coverageLine: "Auto",
        coverageType: "auto_liability",
        minCoverageUsd: 25_000,
        maxCoverageUsd: 300_000,
        basePremiumPct: 0.5,
        features: [
          "Third-party liability",
          "Property damage",
          "Bodily injury coverage",
          "Legal defense costs",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 20,
      },
      {
        productId: "auto-full",
        name: "Auto Comprehensive",
        slug: "auto-full",
        description: "Full comprehensive auto coverage including collision and theft.",
        coverageLine: "Auto",
        coverageType: "auto_full",
        minCoverageUsd: 10_000,
        maxCoverageUsd: 500_000,
        basePremiumPct: 0.47,
        features: [
          "Collision coverage",
          "Comprehensive (theft, weather)",
          "Roadside assistance",
          "Rental reimbursement",
          "Up to $500K coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 21,
      },
      // ── Life ──
      {
        productId: "life-term-20",
        name: "Term Life 20yr",
        slug: "life-term-20",
        description: "20-year term life insurance with onchain beneficiary payouts.",
        coverageLine: "Life",
        coverageType: "life_term",
        minCoverageUsd: 100_000,
        maxCoverageUsd: 5_000_000,
        basePremiumPct: 0.096,
        features: [
          "20-year term",
          "Onchain beneficiary payouts",
          "No medical exam up to $500K",
          "Convertible to whole life",
          "Up to $5M coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 30,
      },
      // ── Travel ──
      {
        productId: "travel-basic",
        name: "Travel Basic",
        slug: "travel-basic",
        description: "Trip protection covering cancellations, delays, and lost luggage.",
        coverageLine: "Travel",
        coverageType: "travel_basic",
        minCoverageUsd: 500,
        maxCoverageUsd: 10_000,
        basePremiumPct: 4.5,
        features: [
          "Trip cancellation",
          "Flight delay coverage",
          "Lost luggage",
          "Emergency evacuation",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 40,
      },
      {
        productId: "travel-medical",
        name: "Travel Medical",
        slug: "travel-medical",
        description: "International medical coverage while traveling abroad.",
        coverageLine: "Travel",
        coverageType: "travel_medical",
        minCoverageUsd: 50_000,
        maxCoverageUsd: 1_000_000,
        basePremiumPct: 1.2,
        features: [
          "Emergency medical abroad",
          "Medical evacuation",
          "24/7 telemedicine",
          "Pre-existing condition coverage",
          "Up to $1M medical coverage",
        ],
        riskLevel: "Low" as const,
        isActive: true,
        sortOrder: 41,
      },
    ];

    let count = 0;
    for (const product of products) {
      await ctx.db.insert("products", { ...product, createdAt: now });
      count++;
    }

    return { ok: true, count };
  },
});
