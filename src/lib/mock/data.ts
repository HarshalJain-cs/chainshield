export type CoverageLine = "defi" | "health" | "auto" | "life" | "finance" | "travel";

export const lineMeta: Record<CoverageLine, { label: string; tagline: string; color: string; perils: string[] }> = {
  defi:    { label: "DeFi",    tagline: "Smart-contract & oracle risk", color: "265 85% 65%", perils: ["Smart-contract exploit", "Oracle failure", "Stablecoin depeg"] },
  health:  { label: "Health",  tagline: "Hospital, clinic & pharmacy",   color: "345 95% 65%", perils: ["Hospitalization", "Surgery", "Prescription drugs"] },
  auto:    { label: "Auto",    tagline: "Liability, collision & theft",  color: "200 90% 60%", perils: ["Collision", "Theft", "Third-party liability"] },
  life:    { label: "Life",    tagline: "Term life with beneficiaries",  color: "20 95% 60%",  perils: ["Death", "Critical illness", "Disability"] },
  finance: { label: "Finance", tagline: "Wallet hacks & insolvency",     color: "152 75% 55%", perils: ["Wallet hack", "Exchange insolvency", "Custodian failure"] },
  travel:  { label: "Travel",  tagline: "Trip cancel & medical abroad",  color: "42 95% 60%",  perils: ["Trip cancellation", "Lost luggage", "Medical abroad"] },
};

export type CoverageProduct = {
  id: string;
  line: CoverageLine;
  name: string;
  symbol: string;
  category: string;     // sub-category within line
  region: string;       // chain (DeFi) or region (others)
  tier: "Basic" | "Standard" | "Premium";
  risk: "Low" | "Medium" | "High";
  premium: number;      // % for DeFi (annual), monthly USD for health/life, annual USD for auto, flat USD for travel
  premiumModel: "pct_apy" | "monthly_usd" | "annual_usd" | "flat_usd";
  capacityUsd: number;
  utilizationPct: number;
  tvlUsd: number;       // also doubles as "lives covered" * 1000 for non-DeFi (cosmetic)
  color: string;
  meta?: Record<string, string | number>;
};

export const products: CoverageProduct[] = [
  // DeFi
  { id: "uniswap",   line: "defi", name: "Uniswap v4",   symbol: "UNI",  category: "DEX",         region: "Ethereum", tier: "Standard", risk: "Low",    premium: 1.8, premiumModel: "pct_apy", capacityUsd: 42_500_000, utilizationPct: 62, tvlUsd: 5_200_000_000, color: "265 85% 65%" },
  { id: "aave",      line: "defi", name: "Aave v3",      symbol: "AAVE", category: "Lending",     region: "Ethereum", tier: "Standard", risk: "Low",    premium: 2.1, premiumModel: "pct_apy", capacityUsd: 38_900_000, utilizationPct: 71, tvlUsd: 11_800_000_000, color: "300 80% 60%" },
  { id: "lido",      line: "defi", name: "Lido stETH",   symbol: "LDO",  category: "Staking",     region: "Ethereum", tier: "Standard", risk: "Medium", premium: 2.6, premiumModel: "pct_apy", capacityUsd: 28_400_000, utilizationPct: 84, tvlUsd: 22_400_000_000, color: "200 90% 60%" },
  { id: "gmx",       line: "defi", name: "GMX v2",       symbol: "GMX",  category: "Derivatives", region: "Arbitrum", tier: "Premium",  risk: "Medium", premium: 3.4, premiumModel: "pct_apy", capacityUsd: 14_200_000, utilizationPct: 55, tvlUsd: 540_000_000, color: "172 100% 45%" },
  { id: "curve",     line: "defi", name: "Curve",        symbol: "CRV",  category: "DEX",         region: "Ethereum", tier: "Standard", risk: "Medium", premium: 2.9, premiumModel: "pct_apy", capacityUsd: 22_100_000, utilizationPct: 47, tvlUsd: 2_100_000_000, color: "42 95% 60%" },
  { id: "compound",  line: "defi", name: "Compound v3",  symbol: "COMP", category: "Lending",     region: "Base",     tier: "Basic",    risk: "Low",    premium: 2.0, premiumModel: "pct_apy", capacityUsd: 18_300_000, utilizationPct: 58, tvlUsd: 2_400_000_000, color: "152 75% 55%" },

  // Health
  { id: "health-basic",   line: "health", name: "EssentialCare",  symbol: "HBC", category: "Outpatient",   region: "Global",     tier: "Basic",    risk: "Low",    premium: 38,  premiumModel: "monthly_usd", capacityUsd: 12_000_000, utilizationPct: 64, tvlUsd: 4_200_000, color: "345 95% 65%", meta: { deductible: 250, coverageMax: 50_000 } },
  { id: "health-std",     line: "health", name: "StandardCare+",  symbol: "HSC", category: "Inpatient",    region: "Global",     tier: "Standard", risk: "Low",    premium: 89,  premiumModel: "monthly_usd", capacityUsd: 18_500_000, utilizationPct: 72, tvlUsd: 7_800_000, color: "345 95% 65%", meta: { deductible: 500, coverageMax: 250_000 } },
  { id: "health-prem",    line: "health", name: "PremiumCare 360", symbol: "HPC", category: "Full coverage", region: "Global",    tier: "Premium",  risk: "Medium", premium: 189, premiumModel: "monthly_usd", capacityUsd: 24_000_000, utilizationPct: 58, tvlUsd: 11_200_000, color: "345 95% 65%", meta: { deductible: 0, coverageMax: 1_000_000 } },

  // Auto
  { id: "auto-liability", line: "auto", name: "RoadGuard Liability", symbol: "AUL", category: "Liability", region: "EU/US",     tier: "Basic",    risk: "Low",    premium: 480,  premiumModel: "annual_usd", capacityUsd: 9_400_000, utilizationPct: 51, tvlUsd: 3_100_000, color: "200 90% 60%", meta: { vehicleClass: "Sedan", maxPayoutUsd: 100_000 } },
  { id: "auto-full",      line: "auto", name: "RoadGuard Full",      symbol: "AUF", category: "Comprehensive", region: "EU/US", tier: "Standard", risk: "Medium", premium: 1_180, premiumModel: "annual_usd", capacityUsd: 14_800_000, utilizationPct: 67, tvlUsd: 6_200_000, color: "200 90% 60%", meta: { vehicleClass: "Any", maxPayoutUsd: 250_000 } },
  { id: "auto-ev",        line: "auto", name: "EV Cover Pro",        symbol: "AEV", category: "EV-only",       region: "Global", tier: "Premium",  risk: "Medium", premium: 1_640, premiumModel: "annual_usd", capacityUsd: 8_200_000, utilizationPct: 44, tvlUsd: 2_900_000, color: "200 90% 60%", meta: { vehicleClass: "EV", maxPayoutUsd: 400_000 } },

  // Life
  { id: "life-term-10",   line: "life", name: "Term Life — 10y",  symbol: "LT1", category: "Term",        region: "Global", tier: "Basic",    risk: "Low",    premium: 22,  premiumModel: "monthly_usd", capacityUsd: 30_000_000, utilizationPct: 41, tvlUsd: 9_400_000, color: "20 95% 60%", meta: { coverageMax: 250_000, term: "10 years" } },
  { id: "life-term-20",   line: "life", name: "Term Life — 20y",  symbol: "LT2", category: "Term",        region: "Global", tier: "Standard", risk: "Low",    premium: 48,  premiumModel: "monthly_usd", capacityUsd: 42_000_000, utilizationPct: 56, tvlUsd: 14_200_000, color: "20 95% 60%", meta: { coverageMax: 500_000, term: "20 years" } },
  { id: "life-whole",     line: "life", name: "Whole Life",       symbol: "LWH", category: "Whole life",  region: "Global", tier: "Premium",  risk: "Medium", premium: 145, premiumModel: "monthly_usd", capacityUsd: 28_000_000, utilizationPct: 62, tvlUsd: 16_800_000, color: "20 95% 60%", meta: { coverageMax: 1_000_000, term: "Lifetime" } },

  // Finance
  { id: "fin-wallet",     line: "finance", name: "WalletShield",     symbol: "FWS", category: "Wallet hack",   region: "Global", tier: "Standard", risk: "Medium", premium: 2.8, premiumModel: "pct_apy", capacityUsd: 16_400_000, utilizationPct: 59, tvlUsd: 8_200_000, color: "152 75% 55%", meta: { coversCustodial: "No" } },
  { id: "fin-cex",        line: "finance", name: "ExchangeGuard",    symbol: "FEG", category: "CEX insolvency", region: "Global", tier: "Premium",  risk: "High",   premium: 4.2, premiumModel: "pct_apy", capacityUsd: 11_200_000, utilizationPct: 73, tvlUsd: 5_400_000, color: "152 75% 55%", meta: { topCexOnly: "Yes" } },

  // Travel
  { id: "travel-basic",   line: "travel", name: "Trip Saver",        symbol: "TVB", category: "Cancellation", region: "Global", tier: "Basic",    risk: "Low",    premium: 28, premiumModel: "flat_usd", capacityUsd: 4_200_000, utilizationPct: 38, tvlUsd: 1_400_000, color: "42 95% 60%", meta: { tripDays: 14, maxPayoutUsd: 5_000 } },
  { id: "travel-medical", line: "travel", name: "MedAbroad Plus",    symbol: "TVM", category: "Medical",      region: "Global", tier: "Premium",  risk: "Medium", premium: 78, premiumModel: "flat_usd", capacityUsd: 6_800_000, utilizationPct: 52, tvlUsd: 2_800_000, color: "42 95% 60%", meta: { tripDays: 30, maxPayoutUsd: 100_000 } },
];

// Backward-compat alias (older imports)
export const protocols = products;
export type Protocol = CoverageProduct;

export type PaymentFrequency = "monthly" | "quarterly" | "yearly" | "one-time";

export type Policy = {
  id: string;
  productId: string;
  coverageType: CoverageLine;
  amountUsd: number;
  premiumUsd: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Claimed";
  beneficiaries?: { name: string; wallet: string; share: number }[];
};

export const policies: Policy[] = [
  { id: "P-1042", productId: "aave",         coverageType: "defi",   amountUsd: 25_000, premiumUsd: 525, paymentFrequency: "yearly",  startDate: "2025-09-01", endDate: "2026-03-01", status: "Active" },
  { id: "P-1056", productId: "lido",         coverageType: "defi",   amountUsd: 10_000, premiumUsd: 260, paymentFrequency: "yearly",  startDate: "2025-10-12", endDate: "2026-04-12", status: "Active" },
  { id: "P-2010", productId: "health-std",   coverageType: "health", amountUsd: 250_000, premiumUsd: 89, paymentFrequency: "monthly", startDate: "2025-08-01", endDate: "2026-08-01", status: "Active" },
  { id: "P-2034", productId: "auto-full",    coverageType: "auto",   amountUsd: 250_000, premiumUsd: 1_180, paymentFrequency: "yearly", startDate: "2025-07-15", endDate: "2026-07-15", status: "Active" },
  { id: "P-2089", productId: "life-term-20", coverageType: "life",   amountUsd: 500_000, premiumUsd: 48, paymentFrequency: "monthly", startDate: "2025-04-01", endDate: "2045-04-01", status: "Active", beneficiaries: [{ name: "A. Smith", wallet: "0x9F…3AaB", share: 100 }] },
  { id: "P-2112", productId: "travel-medical", coverageType: "travel", amountUsd: 100_000, premiumUsd: 78, paymentFrequency: "one-time", startDate: "2025-12-01", endDate: "2025-12-31", status: "Expired" },
  { id: "P-0987", productId: "uniswap",      coverageType: "defi",   amountUsd: 5_000,  premiumUsd: 90, paymentFrequency: "yearly",   startDate: "2025-06-04", endDate: "2025-12-04", status: "Expired" },
];

export type ClaimStatus = "Submitted" | "Oracle check" | "Auto-approved" | "Manual review" | "Approved" | "Rejected" | "Paid";

export type Claim = {
  id: string;
  policyId: string;
  productId: string;
  claimType: CoverageLine;
  incidentType: string;
  amountUsd: number;
  filedAt: string;
  status: ClaimStatus;
  oracleVerdict?: "pass" | "fail" | "n/a";
  votesFor: number;
  votesAgainst: number;
  description: string;
};

export const claims: Claim[] = [
  { id: "C-302", policyId: "P-1042", productId: "aave",         claimType: "defi",   incidentType: "Oracle manipulation", amountUsd: 12_400, filedAt: "2026-01-08", status: "Manual review", oracleVerdict: "pass", votesFor: 1240, votesAgainst: 320,  description: "Oracle manipulation incident on Polygon market caused depeg." },
  { id: "C-310", policyId: "P-2010", productId: "health-std",   claimType: "health", incidentType: "Hospitalization",     amountUsd: 8_400,  filedAt: "2026-01-15", status: "Oracle check", oracleVerdict: "n/a", votesFor: 0, votesAgainst: 0, description: "5-day inpatient stay following appendectomy. Provider invoice attached." },
  { id: "C-311", policyId: "P-2034", productId: "auto-full",    claimType: "auto",   incidentType: "Collision",           amountUsd: 6_200,  filedAt: "2026-01-18", status: "Auto-approved", oracleVerdict: "pass", votesFor: 0, votesAgainst: 0, description: "Rear-end collision, third-party at fault. Police report #A-29412." },
  { id: "C-298", policyId: "P-1056", productId: "lido",         claimType: "defi",   incidentType: "Validator slashing",  amountUsd: 4_800,  filedAt: "2025-12-22", status: "Approved", oracleVerdict: "pass", votesFor: 2890, votesAgainst: 110,  description: "Validator slashing event affected stETH redemption." },
  { id: "C-289", policyId: "P-0987", productId: "uniswap",      claimType: "defi",   incidentType: "User error",          amountUsd: 1_200,  filedAt: "2025-11-30", status: "Rejected", oracleVerdict: "fail", votesFor: 320, votesAgainst: 1900,  description: "User error — insufficient evidence of protocol failure." },
  { id: "C-275", policyId: "P-2089", productId: "life-term-20", claimType: "life",   incidentType: "Death claim",         amountUsd: 500_000, filedAt: "2025-11-02", status: "Paid", oracleVerdict: "pass", votesFor: 4200, votesAgainst: 80, description: "Beneficiary payout completed via onchain disbursement." },
];

export type Pool = {
  id: string;
  productId: string;
  name: string;
  poolType: "DeFi" | "Health" | "Auto" | "Life" | "Mixed";
  apy: number;
  tvlUsd: number;
  utilizationPct: number;
  acceptedTokens: string[];
  myStakeUsd?: number;
};

export const pools: Pool[] = [
  { id: "pool-aave",   productId: "aave",         name: "Aave Cover Pool",      poolType: "DeFi",   apy: 9.2,  tvlUsd: 12_400_000, utilizationPct: 71, acceptedTokens: ["USDC", "DAI"], myStakeUsd: 2500 },
  { id: "pool-uni",    productId: "uniswap",      name: "Uniswap Cover Pool",   poolType: "DeFi",   apy: 7.4,  tvlUsd: 18_900_000, utilizationPct: 62, acceptedTokens: ["USDC", "ETH"] },
  { id: "pool-lido",   productId: "lido",         name: "Lido Cover Pool",      poolType: "DeFi",   apy: 11.8, tvlUsd: 9_800_000,  utilizationPct: 84, acceptedTokens: ["USDC", "stETH"], myStakeUsd: 800 },
  { id: "pool-health", productId: "health-std",   name: "Health Cover Pool",    poolType: "Health", apy: 6.4,  tvlUsd: 14_200_000, utilizationPct: 58, acceptedTokens: ["USDC"] },
  { id: "pool-auto",   productId: "auto-full",    name: "Auto Cover Pool",      poolType: "Auto",   apy: 7.1,  tvlUsd: 10_800_000, utilizationPct: 64, acceptedTokens: ["USDC"], myStakeUsd: 1500 },
  { id: "pool-life",   productId: "life-term-20", name: "Life Cover Pool",      poolType: "Life",   apy: 5.8,  tvlUsd: 22_400_000, utilizationPct: 49, acceptedTokens: ["USDC", "DAI"] },
  { id: "pool-mixed",  productId: "aave",         name: "Aegis Mixed Pool",     poolType: "Mixed",  apy: 10.4, tvlUsd: 31_200_000, utilizationPct: 67, acceptedTokens: ["USDC", "DAI", "ETH"] },
];

export type Premium = {
  id: string;
  policyId: string;
  amountUsd: number;
  paidAt: string;
  status: "Paid" | "Pending" | "Failed";
};

export const premiums: Premium[] = [
  { id: "PR-9001", policyId: "P-2010", amountUsd: 89,    paidAt: "2026-01-01", status: "Paid" },
  { id: "PR-9000", policyId: "P-2010", amountUsd: 89,    paidAt: "2025-12-01", status: "Paid" },
  { id: "PR-8970", policyId: "P-2089", amountUsd: 48,    paidAt: "2026-01-01", status: "Paid" },
  { id: "PR-8920", policyId: "P-2034", amountUsd: 1_180, paidAt: "2025-07-15", status: "Paid" },
  { id: "PR-8810", policyId: "P-1042", amountUsd: 525,   paidAt: "2025-09-01", status: "Paid" },
];

export type Proposal = {
  id: string;
  title: string;
  summary: string;
  status: "Active" | "Passed" | "Rejected";
  votesFor: number;
  votesAgainst: number;
  endsIn: string;
  author: string;
};

export const proposals: Proposal[] = [
  { id: "AIP-014", title: "Onboard EV-only auto cover line",          summary: "Add a new dedicated pool for electric vehicles with battery-incident coverage, capped at $10M capacity.", status: "Active",   votesFor: 4_120_000, votesAgainst: 980_000,   endsIn: "2d 14h", author: "0x9F…3AaB" },
  { id: "AIP-013", title: "Add maternity rider to Health line",       summary: "Extend StandardCare+ and PremiumCare 360 with prenatal, delivery, and postnatal coverage at +$22/mo.", status: "Active",   votesFor: 2_800_000, votesAgainst: 1_900_000, endsIn: "5d 02h", author: "0x12…F0c1" },
  { id: "AIP-012", title: "Treasury allocation: 5% to security audits", summary: "Earmark 5% of monthly treasury inflows toward continuous protocol & actuarial audits across all coverage lines.", status: "Passed",  votesFor: 6_400_000, votesAgainst: 410_000,   endsIn: "Closed", author: "0xAA…77B2" },
  { id: "AIP-011", title: "Increase max Life cover term to 30 years", summary: "Extend maximum Life policy duration from 20 to 30 years.", status: "Rejected", votesFor: 1_100_000, votesAgainst: 3_900_000, endsIn: "Closed", author: "0x44…9eF0" },
];

export const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

export const fmtNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

export const formatPremium = (p: CoverageProduct) => {
  switch (p.premiumModel) {
    case "pct_apy":     return `${p.premium.toFixed(2)}%`;
    case "monthly_usd": return `$${p.premium}/mo`;
    case "annual_usd":  return `$${p.premium}/yr`;
    case "flat_usd":    return `$${p.premium} flat`;
  }
};
