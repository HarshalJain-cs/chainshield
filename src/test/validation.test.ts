import { describe, it, expect } from "vitest";
import {
  purchasePolicySchema,
  submitClaimSchemaBase,
  stakeSchema,
  voteSchema,
  beneficiarySchema,
} from "@/lib/validation";

const validPurchase = {
  coverageType: "defi_smart_contract",
  coverageAmountUsd: 25_000,
  premiumAmountUsd: 525,
  premiumToken: "USDC" as const,
  paymentFrequency: "yearly" as const,
  autoRenew: false,
  productId: "aave",
  durationMonths: 12,
};

describe("purchasePolicySchema", () => {
  it("accepts a valid purchase", () => {
    expect(purchasePolicySchema.safeParse(validPurchase).success).toBe(true);
  });
  it("rejects coverage below the minimum", () => {
    const r = purchasePolicySchema.safeParse({ ...validPurchase, coverageAmountUsd: 50 });
    expect(r.success).toBe(false);
  });
  it("rejects coverage above the maximum", () => {
    const r = purchasePolicySchema.safeParse({ ...validPurchase, coverageAmountUsd: 20_000_000 });
    expect(r.success).toBe(false);
  });
  it("rejects an unsupported token", () => {
    const r = purchasePolicySchema.safeParse({ ...validPurchase, premiumToken: "BTC" });
    expect(r.success).toBe(false);
  });
  it("rejects durations longer than 36 months", () => {
    const r = purchasePolicySchema.safeParse({ ...validPurchase, durationMonths: 48 });
    expect(r.success).toBe(false);
  });
  it("validates beneficiary wallet addresses", () => {
    const r = purchasePolicySchema.safeParse({
      ...validPurchase,
      beneficiaries: [{ name: "A", wallet: "not-an-address", share: 100 }],
    });
    expect(r.success).toBe(false);
  });
});

describe("submitClaimSchemaBase", () => {
  const valid = {
    policyId: "abc123",
    claimType: "defi",
    incidentType: "Oracle manipulation",
    description: "A detailed description that is long enough to pass validation.",
    requestedAmountUsd: 12_400,
  };
  it("accepts a valid claim", () => {
    expect(submitClaimSchemaBase.safeParse(valid).success).toBe(true);
  });
  it("rejects descriptions that are too short", () => {
    const r = submitClaimSchemaBase.safeParse({ ...valid, description: "too short" });
    expect(r.success).toBe(false);
  });
  it("rejects non-positive amounts", () => {
    const r = submitClaimSchemaBase.safeParse({ ...valid, requestedAmountUsd: 0 });
    expect(r.success).toBe(false);
  });
});

describe("stakeSchema", () => {
  it("accepts a valid stake", () => {
    expect(stakeSchema.safeParse({ poolId: "pool-aave", amountUsd: 2500, token: "USDC" }).success).toBe(true);
  });
  it("rejects stakes below the minimum", () => {
    expect(stakeSchema.safeParse({ poolId: "pool-aave", amountUsd: 50, token: "USDC" }).success).toBe(false);
  });
});

describe("voteSchema", () => {
  it("accepts a valid vote", () => {
    expect(voteSchema.safeParse({ proposalId: "p1", vote: "for", votingPower: 100 }).success).toBe(true);
  });
  it("rejects voting with zero power", () => {
    expect(voteSchema.safeParse({ proposalId: "p1", vote: "for", votingPower: 0 }).success).toBe(false);
  });
  it("rejects an invalid vote option", () => {
    expect(voteSchema.safeParse({ proposalId: "p1", vote: "maybe", votingPower: 10 }).success).toBe(false);
  });
});

describe("beneficiarySchema", () => {
  it("accepts a valid beneficiary", () => {
    const r = beneficiarySchema.safeParse({
      name: "Alice",
      wallet: "0x1111111111111111111111111111111111111111",
      share: 100,
    });
    expect(r.success).toBe(true);
  });
  it("rejects shares above 100", () => {
    const r = beneficiarySchema.safeParse({
      name: "Alice",
      wallet: "0x1111111111111111111111111111111111111111",
      share: 150,
    });
    expect(r.success).toBe(false);
  });
});
