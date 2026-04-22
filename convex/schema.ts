import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(), // checksummed EVM address (lowercase)
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(
      v.literal("policyholder"),
      v.literal("liquidity_provider"),
      v.literal("admin"),
      v.literal("reviewer")
    ),
    kycStatus: v.union(
      v.literal("none"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    isSuspended: v.boolean(),
    totalCoverageUsd: v.number(),
    createdAt: v.number(), // timestamp ms
  }).index("by_wallet", ["walletAddress"]),

  policies: defineTable({
    onchainPolicyId: v.optional(v.number()), // from smart contract
    policyholder: v.string(), // wallet address
    coverageType: v.union(
      v.literal("defi_smart_contract"),
      v.literal("defi_protocol_hack"),
      v.literal("defi_oracle_failure"),
      v.literal("health_basic"),
      v.literal("health_standard"),
      v.literal("health_premium"),
      v.literal("life_term"),
      v.literal("auto_liability"),
      v.literal("auto_full"),
      v.literal("auto_ev"),
      v.literal("finance_wallet"),
      v.literal("finance_cex"),
      v.literal("travel_basic"),
      v.literal("travel_medical")
    ),
    coverageAmountUsd: v.number(),
    premiumAmountUsd: v.number(),
    premiumToken: v.string(), // "ETH" | "USDC" | "DAI"
    paymentFrequency: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("one_time")
    ),
    autoRenew: v.boolean(),
    productId: v.string(), // references mock product catalog
    poolId: v.optional(v.string()),
    startDate: v.string(), // ISO date
    endDate: v.string(),   // ISO date
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("claimed")
    ),
    beneficiaries: v.optional(
      v.array(v.object({ name: v.string(), wallet: v.string(), share: v.number() }))
    ),
    txHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_policyholder", ["policyholder"])
    .index("by_status", ["status"]),

  claims: defineTable({
    onchainClaimId: v.optional(v.number()),
    policyId: v.id("policies"),
    claimant: v.string(), // wallet address
    claimType: v.string(), // matches coverageType categories
    incidentType: v.string(),
    incidentDate: v.optional(v.string()),
    description: v.string(),
    requestedAmountUsd: v.number(),
    approvedAmountUsd: v.optional(v.number()),
    // DeFi-specific
    incidentTxHash: v.optional(v.string()),
    affectedContract: v.optional(v.string()),
    protocolName: v.optional(v.string()),
    // Health-specific
    providerName: v.optional(v.string()),
    treatmentFrom: v.optional(v.string()),
    treatmentTo: v.optional(v.string()),
    // Auto-specific
    policeReport: v.optional(v.string()),
    repairEstimate: v.optional(v.number()),
    // Evidence
    evidenceCids: v.array(v.string()),
    // Oracle + review
    oracleVerdict: v.optional(
      v.union(v.literal("pass"), v.literal("fail"), v.literal("n/a"))
    ),
    votesFor: v.number(),
    votesAgainst: v.number(),
    status: v.union(
      v.literal("Submitted"),
      v.literal("Oracle check"),
      v.literal("Auto-approved"),
      v.literal("Manual review"),
      v.literal("Approved"),
      v.literal("Rejected"),
      v.literal("Paid")
    ),
    assignedReviewer: v.optional(v.string()),
    reviewerNotes: v.optional(v.string()),
    payoutTxHash: v.optional(v.string()),
    txHashSubmitted: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_claimant", ["claimant"])
    .index("by_policy", ["policyId"])
    .index("by_status", ["status"]),

  pools: defineTable({
    poolId: v.string(), // e.g., "pool-aave"
    productId: v.string(),
    name: v.string(),
    poolType: v.union(
      v.literal("DeFi"),
      v.literal("Health"),
      v.literal("Auto"),
      v.literal("Life"),
      v.literal("Mixed")
    ),
    apy: v.number(),
    tvlUsd: v.number(),
    utilizationPct: v.number(),
    acceptedTokens: v.array(v.string()),
    isActive: v.boolean(),
    isAcceptingDeposits: v.boolean(),
    riskLevel: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    lockPeriodDays: v.number(),
    contractAddress: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_pool_id", ["poolId"]),

  lpPositions: defineTable({
    poolId: v.id("pools"),
    lpAddress: v.string(), // wallet address
    depositedAmountUsd: v.number(),
    depositedToken: v.string(),
    lpShares: v.number(),
    totalEarnedUsd: v.number(),
    isActive: v.boolean(),
    depositTxHash: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lp", ["lpAddress"])
    .index("by_pool", ["poolId"]),

  premiums: defineTable({
    policyId: v.id("policies"),
    payerAddress: v.string(),
    amountUsd: v.number(),
    token: v.string(),
    periodStart: v.string(),
    periodEnd: v.string(),
    txHash: v.optional(v.string()),
    status: v.union(v.literal("Paid"), v.literal("Pending"), v.literal("Failed")),
    paidAt: v.number(),
  })
    .index("by_policy", ["policyId"])
    .index("by_payer", ["payerAddress"]),

  notifications: defineTable({
    walletAddress: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_wallet", ["walletAddress"]),
});
