import { getContract } from "thirdweb";
import { client } from "../thirdweb";
import { sepolia } from "thirdweb/chains";
import { POLICY_MANAGER_ABI } from "./abis/PolicyManager";
import { INSURANCE_POOL_ABI } from "./abis/InsurancePool";
import { CLAIMS_PROCESSOR_ABI } from "./abis/ClaimsProcessor";
import { CHAIN_SHIELD_TOKEN_ABI } from "./abis/ChainShieldToken";
import { L_P_TOKEN_ABI as LP_TOKEN_ABI } from "./abis/LPToken";
import { CHAIN_SHIELD_GOVERNOR_ABI } from "./abis/ChainShieldGovernor";

// Resolve addresses from environment variables, falling back to (valid,
// lowercase) placeholder addresses. Placeholders must be lowercase so they pass
// thirdweb's EIP-55 checksum validation — a mixed-case invalid checksum makes
// getContract() throw at module load and crashes any page that imports this file
// (this is what previously broke the Claims and Stake pages in demo mode).
const PLACEHOLDERS = {
  POLICY_MANAGER: "0x1234567890abcdef1234567890abcdef12345678",
  INSURANCE_POOL: "0xabcdef0123456789abcdef0123456789abcdef01",
  CLAIMS_PROCESSOR: "0x9876543210fedcba9876543210fedcba98765432",
  CST_TOKEN: "0x1111111111111111111111111111111111111111",
  LP_TOKEN: "0x2222222222222222222222222222222222222222",
  GOVERNOR: "0x3333333333333333333333333333333333333333",
} as const;

/** Normalize an env address; fall back to the placeholder if missing or malformed. */
function resolveAddress(envValue: string | undefined, placeholder: string): string {
  const v = (envValue ?? "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return placeholder;
  return v;
}

export const CONTRACT_ADDRESSES = {
  POLICY_MANAGER: resolveAddress(import.meta.env.VITE_POLICY_MANAGER_ADDRESS, PLACEHOLDERS.POLICY_MANAGER),
  INSURANCE_POOL: resolveAddress(import.meta.env.VITE_INSURANCE_POOL_ADDRESS, PLACEHOLDERS.INSURANCE_POOL),
  CLAIMS_PROCESSOR: resolveAddress(import.meta.env.VITE_CLAIMS_PROCESSOR_ADDRESS, PLACEHOLDERS.CLAIMS_PROCESSOR),
  CST_TOKEN: resolveAddress(import.meta.env.VITE_CST_TOKEN_ADDRESS, PLACEHOLDERS.CST_TOKEN),
  LP_TOKEN: resolveAddress(import.meta.env.VITE_LP_TOKEN_ADDRESS, PLACEHOLDERS.LP_TOKEN),
  GOVERNOR: resolveAddress(import.meta.env.VITE_GOVERNOR_ADDRESS, PLACEHOLDERS.GOVERNOR),
};

// Strongly-typed Thirdweb v5 contract instances. Addresses are guaranteed valid
// by resolveAddress() above, so getContract() will not throw at module load.
export const policyManagerContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.POLICY_MANAGER,
  abi: POLICY_MANAGER_ABI,
});

export const insurancePoolContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.INSURANCE_POOL,
  abi: INSURANCE_POOL_ABI,
});

export const claimsProcessorContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.CLAIMS_PROCESSOR,
  abi: CLAIMS_PROCESSOR_ABI,
});

export const cstTokenContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.CST_TOKEN,
  abi: CHAIN_SHIELD_TOKEN_ABI,
});

export const lpTokenContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.LP_TOKEN,
  abi: LP_TOKEN_ABI,
});

export const governorContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.GOVERNOR,
  abi: CHAIN_SHIELD_GOVERNOR_ABI,
});
