import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ──────────────────────────────────────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────────────────────────────────────
  users: defineTable({
    walletAddress: v.string(), // checksummed EVM address (lowercase)
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),          // from social login (inAppWallet)
    lastLoginAt: v.optional(v.number()),    // timestamp ms
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

  // ──────────────────────────────────────────────────────────────────────────
  // POLICIES
  // ──────────────────────────────────────────────────────────────────────────
  policies: defineTable({
    onchainPolicyId: v.optional(v.number()), // from smart contract
    policyNftTokenId: v.optional(v.number()), // ERC-721 token ID
    ipfsDocumentCid: v.optional(v.string()),  // IPFS CID of policy document
    blockNumber: v.optional(v.number()),       // block at creation
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
    productId: v.string(), // references products table
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

  // ──────────────────────────────────────────────────────────────────────────
  // CLAIMS
  // ──────────────────────────────────────────────────────────────────────────
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
    decisionReason: v.optional(v.string()),   // reason for approval/rejection
    reviewStartedAt: v.optional(v.number()),  // when reviewer picked up claim
    reviewCompletedAt: v.optional(v.number()), // when decision was made
    appealDeadline: v.optional(v.number()),   // deadline for appeal after rejection
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

  // ──────────────────────────────────────────────────────────────────────────
  // CLAIM MESSAGES (communication thread)
  // ──────────────────────────────────────────────────────────────────────────
  claimMessages: defineTable({
    claimId: v.id("claims"),
    senderWallet: v.string(),
    senderRole: v.union(v.literal("claimant"), v.literal("reviewer"), v.literal("system")),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_claim", ["claimId"]),

  // ──────────────────────────────────────────────────────────────────────────
  // POOLS
  // ──────────────────────────────────────────────────────────────────────────
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
    minDeposit: v.optional(v.number()),           // minimum deposit in USD
    maxCoveragePerPolicy: v.optional(v.number()), // max coverage from this pool
    createdAt: v.number(),
  }).index("by_pool_id", ["poolId"]),

  // ──────────────────────────────────────────────────────────────────────────
  // LP POSITIONS
  // ──────────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────────
  // PREMIUMS
  // ──────────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────
  notifications: defineTable({
    walletAddress: v.string(),
    type: v.string(),  // "claim_update" | "policy_expiring" | "yield_earned" | etc.
    title: v.string(),
    body: v.optional(v.string()),
    isRead: v.boolean(),
    metadata: v.optional(v.any()),   // extra structured data (claimId, policyId, etc.)
    actionUrl: v.optional(v.string()), // navigate here on click
    createdAt: v.number(),
  }).index("by_wallet", ["walletAddress"]),

  // ──────────────────────────────────────────────────────────────────────────
  // PRODUCTS (product catalog, migrated from mock data)
  // ──────────────────────────────────────────────────────────────────────────
  products: defineTable({
    productId: v.string(),   // e.g., "aave", "health-std"
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    coverageLine: v.string(), // "DeFi" | "Health" | "Auto" | "Life" | "Travel"
    coverageType: v.string(), // maps to policies.coverageType
    minCoverageUsd: v.number(),
    maxCoverageUsd: v.number(),
    basePremiumPct: v.number(), // annual premium as % of coverage
    features: v.array(v.string()),
    riskLevel: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
    isActive: v.boolean(),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_product_id", ["productId"])
    .index("by_coverage_line", ["coverageLine"]),

  // ──────────────────────────────────────────────────────────────────────────
  // GOVERNANCE PROPOSALS
  // ──────────────────────────────────────────────────────────────────────────
  governanceProposals: defineTable({
    onchainProposalId: v.optional(v.string()), // bytes32 from Governor contract
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
    status: v.union(
      v.literal("Draft"),
      v.literal("Active"),
      v.literal("Succeeded"),
      v.literal("Defeated"),
      v.literal("Queued"),
      v.literal("Executed"),
      v.literal("Cancelled")
    ),
    votesFor: v.number(),     // CST-weighted (or count in demo mode)
    votesAgainst: v.number(),
    votesAbstain: v.number(),
    quorumRequired: v.number(),
    votingStartsAt: v.number(), // timestamp ms
    votingEndsAt: v.number(),   // timestamp ms
    timelockEndsAt: v.optional(v.number()), // after voting, before execution
    executedAt: v.optional(v.number()),
    txHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_proposer", ["proposerWallet"]),

  // ──────────────────────────────────────────────────────────────────────────
  // VOTES (individual vote records)
  // ──────────────────────────────────────────────────────────────────────────
  votes: defineTable({
    proposalId: v.id("governanceProposals"),
    voterWallet: v.string(),
    support: v.union(v.literal("for"), v.literal("against"), v.literal("abstain")),
    weight: v.number(), // CST balance at vote time (or 1 in demo mode)
    reason: v.optional(v.string()),
    txHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_voter", ["voterWallet"]),

  // ──────────────────────────────────────────────────────────────────────────
  // YIELD SNAPSHOTS (daily pool APY/TVL history for charts)
  // ──────────────────────────────────────────────────────────────────────────
  yieldSnapshots: defineTable({
    poolId: v.id("pools"),
    date: v.string(),       // ISO date "2026-01-15"
    apy: v.number(),
    tvlUsd: v.number(),
    utilizationPct: v.number(),
    premiumCollectedUsd: v.number(),
    createdAt: v.number(),
  }).index("by_pool", ["poolId"]),

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN ACTIONS (immutable audit log)
  // ──────────────────────────────────────────────────────────────────────────
  adminActions: defineTable({
    adminWallet: v.string(),
    action: v.string(),  // "approve_claim" | "reject_claim" | "suspend_user" | etc.
    targetType: v.string(), // "claim" | "user" | "pool" | "policy"
    targetId: v.string(),   // Convex doc _id as string
    details: v.optional(v.any()), // structured details
    createdAt: v.number(),
  })
    .index("by_admin", ["adminWallet"])
    .index("by_action", ["action"]),

  // ──────────────────────────────────────────────────────────────────────────
  // BLOCKCHAIN EVENTS (raw on-chain event mirror)
  // ──────────────────────────────────────────────────────────────────────────
  blockchainEvents: defineTable({
    chainId: v.number(),
    contractAddress: v.string(),
    eventName: v.string(),   // "PolicyCreated" | "ClaimSubmitted" | etc.
    txHash: v.string(),
    blockNumber: v.number(),
    logIndex: v.number(),
    args: v.any(),           // decoded event args
    processed: v.boolean(),  // has this been acted on?
    createdAt: v.number(),
  })
    .index("by_tx", ["txHash"])
    .index("by_event", ["eventName"])
    .index("by_contract", ["contractAddress"]),

});
