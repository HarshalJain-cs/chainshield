export type Protocol = {
  id: string;
  name: string;
  symbol: string;
  category: "DEX" | "Lending" | "Staking" | "Bridge" | "Stablecoin" | "Derivatives";
  chain: "Ethereum" | "Arbitrum" | "Base" | "Optimism";
  risk: "Low" | "Medium" | "High";
  premium: number; // % APY
  capacityUsd: number;
  utilizationPct: number;
  tvlUsd: number;
  color: string;
};

export const protocols: Protocol[] = [
  { id: "uniswap", name: "Uniswap v4", symbol: "UNI", category: "DEX", chain: "Ethereum", risk: "Low", premium: 1.8, capacityUsd: 42_500_000, utilizationPct: 62, tvlUsd: 5_200_000_000, color: "265 85% 65%" },
  { id: "aave", name: "Aave v3", symbol: "AAVE", category: "Lending", chain: "Ethereum", risk: "Low", premium: 2.1, capacityUsd: 38_900_000, utilizationPct: 71, tvlUsd: 11_800_000_000, color: "300 80% 60%" },
  { id: "lido", name: "Lido stETH", symbol: "LDO", category: "Staking", chain: "Ethereum", risk: "Medium", premium: 2.6, capacityUsd: 28_400_000, utilizationPct: 84, tvlUsd: 22_400_000_000, color: "200 90% 60%" },
  { id: "gmx", name: "GMX v2", symbol: "GMX", category: "Derivatives", chain: "Arbitrum", risk: "Medium", premium: 3.4, capacityUsd: 14_200_000, utilizationPct: 55, tvlUsd: 540_000_000, color: "172 100% 45%" },
  { id: "curve", name: "Curve Finance", symbol: "CRV", category: "DEX", chain: "Ethereum", risk: "Medium", premium: 2.9, capacityUsd: 22_100_000, utilizationPct: 47, tvlUsd: 2_100_000_000, color: "42 95% 60%" },
  { id: "compound", name: "Compound v3", symbol: "COMP", category: "Lending", chain: "Base", risk: "Low", premium: 2.0, capacityUsd: 18_300_000, utilizationPct: 58, tvlUsd: 2_400_000_000, color: "152 75% 55%" },
  { id: "stargate", name: "Stargate", symbol: "STG", category: "Bridge", chain: "Optimism", risk: "High", premium: 4.8, capacityUsd: 9_800_000, utilizationPct: 38, tvlUsd: 410_000_000, color: "220 100% 60%" },
  { id: "frax", name: "Frax FRAX", symbol: "FRAX", category: "Stablecoin", chain: "Ethereum", risk: "Medium", premium: 3.1, capacityUsd: 16_700_000, utilizationPct: 66, tvlUsd: 880_000_000, color: "10 90% 60%" },
  { id: "rocketpool", name: "Rocket Pool", symbol: "RPL", category: "Staking", chain: "Ethereum", risk: "Low", premium: 2.4, capacityUsd: 24_900_000, utilizationPct: 73, tvlUsd: 3_900_000_000, color: "20 95% 60%" },
];

export type Policy = {
  id: string;
  protocolId: string;
  amountUsd: number;
  premiumUsd: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Claimed";
};

export const policies: Policy[] = [
  { id: "P-1042", protocolId: "aave", amountUsd: 25_000, premiumUsd: 525, startDate: "2025-09-01", endDate: "2026-03-01", status: "Active" },
  { id: "P-1056", protocolId: "lido", amountUsd: 10_000, premiumUsd: 260, startDate: "2025-10-12", endDate: "2026-04-12", status: "Active" },
  { id: "P-0987", protocolId: "uniswap", amountUsd: 5_000, premiumUsd: 90, startDate: "2025-06-04", endDate: "2025-12-04", status: "Expired" },
];

export type Claim = {
  id: string;
  policyId: string;
  protocolId: string;
  amountUsd: number;
  filedAt: string;
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  votesFor: number;
  votesAgainst: number;
  description: string;
};

export const claims: Claim[] = [
  { id: "C-302", policyId: "P-1042", protocolId: "aave", amountUsd: 12_400, filedAt: "2026-01-08", status: "Voting", votesFor: 1240, votesAgainst: 320, description: "Oracle manipulation incident on Polygon market caused depeg." },
  { id: "C-298", policyId: "P-1056", protocolId: "lido", amountUsd: 4_800, filedAt: "2025-12-22", status: "Approved", votesFor: 2890, votesAgainst: 110, description: "Validator slashing event affected stETH redemption." },
  { id: "C-289", policyId: "P-0987", protocolId: "uniswap", amountUsd: 1_200, filedAt: "2025-11-30", status: "Rejected", votesFor: 320, votesAgainst: 1900, description: "User error — insufficient evidence of protocol failure." },
];

export type Pool = {
  id: string;
  protocolId: string;
  name: string;
  apy: number;
  tvlUsd: number;
  utilizationPct: number;
  myStakeUsd?: number;
};

export const pools: Pool[] = [
  { id: "pool-aave", protocolId: "aave", name: "Aave Cover Pool", apy: 9.2, tvlUsd: 12_400_000, utilizationPct: 71, myStakeUsd: 2500 },
  { id: "pool-uni", protocolId: "uniswap", name: "Uniswap Cover Pool", apy: 7.4, tvlUsd: 18_900_000, utilizationPct: 62 },
  { id: "pool-lido", protocolId: "lido", name: "Lido Cover Pool", apy: 11.8, tvlUsd: 9_800_000, utilizationPct: 84, myStakeUsd: 800 },
  { id: "pool-gmx", protocolId: "gmx", name: "GMX Cover Pool", apy: 14.6, tvlUsd: 4_200_000, utilizationPct: 55 },
  { id: "pool-curve", protocolId: "curve", name: "Curve Cover Pool", apy: 8.9, tvlUsd: 7_100_000, utilizationPct: 47 },
  { id: "pool-comp", protocolId: "compound", name: "Compound Cover Pool", apy: 8.1, tvlUsd: 6_300_000, utilizationPct: 58 },
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
  { id: "CIP-014", title: "Onboard Ethena USDe to cover marketplace", summary: "Add a new cover product for Ethena's synthetic dollar with a dedicated risk tier and capacity cap of $20M.", status: "Active", votesFor: 4_120_000, votesAgainst: 980_000, endsIn: "2d 14h", author: "0x9F…3AaB" },
  { id: "CIP-013", title: "Reduce assessor quorum from 8% to 6%", summary: "Lower minimum assessor quorum to speed up legitimate claim resolution while maintaining safety thresholds.", status: "Active", votesFor: 2_800_000, votesAgainst: 1_900_000, endsIn: "5d 02h", author: "0x12…F0c1" },
  { id: "CIP-012", title: "Treasury allocation: 5% to security audits", summary: "Earmark 5% of monthly treasury inflows toward continuous protocol security audits.", status: "Passed", votesFor: 6_400_000, votesAgainst: 410_000, endsIn: "Closed", author: "0xAA…77B2" },
  { id: "CIP-011", title: "Increase max cover duration to 12 months", summary: "Extend maximum policy duration from 6 to 12 months.", status: "Rejected", votesFor: 1_100_000, votesAgainst: 3_900_000, endsIn: "Closed", author: "0x44…9eF0" },
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