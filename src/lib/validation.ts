import { z } from "zod";

// Ethereum address validation
const ethereumAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// Coverage amount validation
const coverageAmount = z
  .number()
  .min(100, "Coverage must be at least $100")
  .max(10_000_000, "Coverage cannot exceed $10M");

// Duration validation
const durationMonths = z
  .number()
  .int()
  .min(1, "Duration must be at least 1 month")
  .max(36, "Duration cannot exceed 36 months");

// Premium validation
const premiumAmount = z
  .number()
  .min(1, "Premium must be at least $1")
  .max(1_000_000, "Premium amount too high");

// Policy purchase validation schema
export const purchasePolicySchema = z.object({
  coverageType: z.string().min(1, "Coverage type is required"),
  coverageAmountUsd: coverageAmount,
  premiumAmountUsd: premiumAmount,
  premiumToken: z.enum(["USDC", "DAI", "ETH"], {
    errorMap: () => ({ message: "Invalid payment token" }),
  }),
  paymentFrequency: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
  autoRenew: z.boolean(),
  productId: z.string().min(1),
  durationMonths,
  beneficiaries: z
    .array(
      z.object({
        name: z.string().min(1, "Beneficiary name required"),
        wallet: ethereumAddress,
        share: z.number().min(1).max(100, "Share must be 1-100%"),
      })
    )
    .optional(),
});

// Claim submission validation schema (flexible for different claim types)
export const submitClaimSchemaBase = z.object({
  policyId: z.string().min(1, "Policy ID is required"),
  claimType: z.string().min(1, "Claim type is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description too long (max 2000 characters)"),
  requestedAmountUsd: z
    .number()
    .min(1, "Claim amount must be positive")
    .max(10_000_000, "Claim amount exceeds maximum"),
  incidentDate: z.string().optional(),
  incidentTxHash: z.string().optional(),
  affectedContract: z.string().optional(),
  protocolName: z.string().optional(),
  providerName: z.string().optional(),
  treatmentFrom: z.string().optional(),
  treatmentTo: z.string().optional(),
  policeReport: z.string().optional(),
  repairEstimate: z.number().optional(),
});

// LP stake validation schema
export const stakeSchema = z.object({
  poolId: z.string().min(1, "Pool ID is required"),
  amountUsd: z
    .number()
    .min(100, "Minimum stake is $100")
    .max(1_000_000, "Maximum stake is $1M"),
  token: z.enum(["USDC", "DAI", "ETH"]),
});

// Governance vote validation schema
export const voteSchema = z.object({
  proposalId: z.string().min(1, "Proposal ID is required"),
  vote: z.enum(["for", "against", "abstain"]),
  votingPower: z.number().min(1, "Must have voting power to vote"),
});

// Beneficiary validation
export const beneficiarySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  wallet: ethereumAddress,
  share: z.number().min(1).max(100),
});

// Type exports for use in components
export type PurchasePolicyInput = z.infer<typeof purchasePolicySchema>;
export type SubmitClaimInput = z.infer<typeof submitClaimSchemaBase>;
export type StakeInput = z.infer<typeof stakeSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
