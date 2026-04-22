import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run once to seed the database with mock data
// Call this from the Convex dashboard or via a button in the app
export const seedDatabase = mutation({
  args: { walletAddress: v.optional(v.string()) },
  handler: async (ctx, { walletAddress }) => {
    const wallet = (walletAddress ?? "0xdemo000000000000000000000000000000000001").toLowerCase();
    const now = Date.now();

    // ── 1. Upsert user ──────────────────────────────────────────────────────
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", wallet))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        walletAddress: wallet,
        displayName: "Demo User",
        role: "policyholder",
        kycStatus: "approved",
        isSuspended: false,
        totalCoverageUsd: 790_000,
        createdAt: now,
      });
    }

    // ── 2. Seed pools ────────────────────────────────────────────────────────
    const poolsData = [
      { poolId: "pool-aave",   productId: "aave",         name: "Aave Cover Pool",      poolType: "DeFi"   as const, apy: 9.2,  tvlUsd: 12_400_000, utilizationPct: 71, acceptedTokens: ["USDC", "DAI"],        riskLevel: "Low"    as const, lockPeriodDays: 7 },
      { poolId: "pool-uni",    productId: "uniswap",      name: "Uniswap Cover Pool",   poolType: "DeFi"   as const, apy: 7.4,  tvlUsd: 18_900_000, utilizationPct: 62, acceptedTokens: ["USDC", "ETH"],        riskLevel: "Low"    as const, lockPeriodDays: 7 },
      { poolId: "pool-lido",   productId: "lido",         name: "Lido Cover Pool",      poolType: "DeFi"   as const, apy: 11.8, tvlUsd: 9_800_000,  utilizationPct: 84, acceptedTokens: ["USDC", "stETH"],      riskLevel: "Medium" as const, lockPeriodDays: 14 },
      { poolId: "pool-health", productId: "health-std",   name: "Health Cover Pool",    poolType: "Health" as const, apy: 6.4,  tvlUsd: 14_200_000, utilizationPct: 58, acceptedTokens: ["USDC"],               riskLevel: "Low"    as const, lockPeriodDays: 30 },
      { poolId: "pool-auto",   productId: "auto-full",    name: "Auto Cover Pool",      poolType: "Auto"   as const, apy: 7.1,  tvlUsd: 10_800_000, utilizationPct: 64, acceptedTokens: ["USDC"],               riskLevel: "Low"    as const, lockPeriodDays: 14 },
      { poolId: "pool-life",   productId: "life-term-20", name: "Life Cover Pool",      poolType: "Life"   as const, apy: 5.8,  tvlUsd: 22_400_000, utilizationPct: 49, acceptedTokens: ["USDC", "DAI"],        riskLevel: "Low"    as const, lockPeriodDays: 30 },
      { poolId: "pool-mixed",  productId: "aave",         name: "Aegis Mixed Pool",     poolType: "Mixed"  as const, apy: 10.4, tvlUsd: 31_200_000, utilizationPct: 67, acceptedTokens: ["USDC", "DAI", "ETH"], riskLevel: "Medium" as const, lockPeriodDays: 7 },
    ];

    const poolIdMap: Record<string, any> = {};
    for (const pool of poolsData) {
      const existing = await ctx.db
        .query("pools")
        .withIndex("by_pool_id", (q) => q.eq("poolId", pool.poolId))
        .first();
      if (!existing) {
        const id = await ctx.db.insert("pools", { ...pool, isActive: true, isAcceptingDeposits: true, createdAt: now });
        poolIdMap[pool.poolId] = id;
      } else {
        poolIdMap[pool.poolId] = existing._id;
      }
    }

    // ── 3. Seed policies ─────────────────────────────────────────────────────
    const policiesData = [
      {
        productId: "aave",
        coverageType: "defi_smart_contract" as const,
        coverageAmountUsd: 25_000,
        premiumAmountUsd: 525,
        premiumToken: "USDC",
        paymentFrequency: "yearly" as const,
        startDate: "2025-09-01",
        endDate: "2026-09-01",
        poolId: "pool-aave",
      },
      {
        productId: "lido",
        coverageType: "defi_oracle_failure" as const,
        coverageAmountUsd: 10_000,
        premiumAmountUsd: 260,
        premiumToken: "ETH",
        paymentFrequency: "yearly" as const,
        startDate: "2025-10-12",
        endDate: "2026-10-12",
        poolId: "pool-lido",
      },
      {
        productId: "health-std",
        coverageType: "health_standard" as const,
        coverageAmountUsd: 250_000,
        premiumAmountUsd: 89,
        premiumToken: "USDC",
        paymentFrequency: "monthly" as const,
        startDate: "2025-08-01",
        endDate: "2026-08-01",
        poolId: "pool-health",
      },
      {
        productId: "auto-full",
        coverageType: "auto_full" as const,
        coverageAmountUsd: 250_000,
        premiumAmountUsd: 1_180,
        premiumToken: "USDC",
        paymentFrequency: "yearly" as const,
        startDate: "2025-07-15",
        endDate: "2026-07-15",
        poolId: "pool-auto",
      },
      {
        productId: "life-term-20",
        coverageType: "life_term" as const,
        coverageAmountUsd: 500_000,
        premiumAmountUsd: 48,
        premiumToken: "USDC",
        paymentFrequency: "monthly" as const,
        startDate: "2025-04-01",
        endDate: "2045-04-01",
        poolId: "pool-life",
        beneficiaries: [{ name: "A. Smith", wallet: "0x9F3AaB", share: 100 }],
      },
    ];

    const policyDocIds: any[] = [];
    for (const p of policiesData) {
      const id = await ctx.db.insert("policies", {
        ...p,
        policyholder: wallet,
        autoRenew: false,
        status: "active",
        onchainPolicyId: Math.floor(Math.random() * 9000) + 1000,
        createdAt: now,
      });
      policyDocIds.push(id);
    }

    // ── 4. Seed premiums ─────────────────────────────────────────────────────
    const premiumsData = [
      { policyIdx: 2, amountUsd: 89,    token: "USDC", periodStart: "2026-01-01", periodEnd: "2026-02-01" },
      { policyIdx: 2, amountUsd: 89,    token: "USDC", periodStart: "2025-12-01", periodEnd: "2026-01-01" },
      { policyIdx: 4, amountUsd: 48,    token: "USDC", periodStart: "2026-01-01", periodEnd: "2026-02-01" },
      { policyIdx: 3, amountUsd: 1_180, token: "USDC", periodStart: "2025-07-15", periodEnd: "2026-07-15" },
      { policyIdx: 0, amountUsd: 525,   token: "USDC", periodStart: "2025-09-01", periodEnd: "2026-09-01" },
    ];

    for (const pr of premiumsData) {
      await ctx.db.insert("premiums", {
        policyId: policyDocIds[pr.policyIdx],
        payerAddress: wallet,
        amountUsd: pr.amountUsd,
        token: pr.token,
        periodStart: pr.periodStart,
        periodEnd: pr.periodEnd,
        status: "Paid",
        paidAt: now - Math.random() * 30 * 24 * 60 * 60 * 1000,
      });
    }

    // ── 5. Seed claims ───────────────────────────────────────────────────────
    const claimsData = [
      {
        policyIdx: 0,
        claimType: "defi",
        incidentType: "Oracle manipulation",
        description: "Oracle manipulation incident on Polygon market caused depeg.",
        requestedAmountUsd: 12_400,
        oracleVerdict: "pass" as const,
        votesFor: 1240,
        votesAgainst: 320,
        status: "Manual review" as const,
        protocolName: "Aave v3",
        incidentTxHash: "0x1a2b3c4d5e6f...",
      },
      {
        policyIdx: 2,
        claimType: "health",
        incidentType: "Hospitalization",
        description: "5-day inpatient stay following appendectomy. Provider invoice attached.",
        requestedAmountUsd: 8_400,
        oracleVerdict: "n/a" as const,
        votesFor: 0,
        votesAgainst: 0,
        status: "Oracle check" as const,
        providerName: "City General Hospital",
        treatmentFrom: "2026-01-10",
        treatmentTo: "2026-01-15",
      },
      {
        policyIdx: 1,
        claimType: "defi",
        incidentType: "Validator slashing",
        description: "Validator slashing event affected stETH redemption.",
        requestedAmountUsd: 4_800,
        oracleVerdict: "pass" as const,
        votesFor: 2890,
        votesAgainst: 110,
        status: "Approved" as const,
        protocolName: "Lido",
      },
    ];

    for (const c of claimsData) {
      const { policyIdx, ...rest } = c;
      await ctx.db.insert("claims", {
        ...rest,
        policyId: policyDocIds[policyIdx],
        claimant: wallet,
        incidentDate: "2026-01-08",
        evidenceCids: [],
        createdAt: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
    }

    // ── 6. Seed LP positions ─────────────────────────────────────────────────
    const lpData = [
      { poolKey: "pool-aave",  amountUsd: 2500, token: "USDC" },
      { poolKey: "pool-lido",  amountUsd: 800,  token: "stETH" },
      { poolKey: "pool-auto",  amountUsd: 1500, token: "USDC" },
    ];

    for (const lp of lpData) {
      const poolDocId = poolIdMap[lp.poolKey] as import("./_generated/dataModel").Id<"pools">;
      if (!poolDocId) continue;
      const pool = await ctx.db.get(poolDocId);
      if (!pool) continue;
      const shares = pool.tvlUsd === 0 ? lp.amountUsd : (lp.amountUsd / pool.tvlUsd) * 1000;

      const existing = await ctx.db
        .query("lpPositions")
        .withIndex("by_lp", (q) => q.eq("lpAddress", wallet))
        .filter((q) => q.eq(q.field("poolId"), poolDocId))
        .first();

      if (!existing) {
        await ctx.db.insert("lpPositions", {
          poolId: poolDocId,
          lpAddress: wallet,
          depositedAmountUsd: lp.amountUsd,
          depositedToken: lp.token,
          lpShares: shares,
          totalEarnedUsd: lp.amountUsd * (pool.apy / 100) * 0.25,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { ok: true, wallet, policiesCreated: policyDocIds.length };
  },
});
