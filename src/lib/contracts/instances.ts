import { getContract } from "thirdweb";
import { client } from "../thirdweb";
import { sepolia } from "thirdweb/chains";
import { POLICY_MANAGER_ABI } from "./abis/PolicyManager";
import { INSURANCE_POOL_ABI } from "./abis/InsurancePool";
import { CLAIMS_PROCESSOR_ABI } from "./abis/ClaimsProcessor";
import { CHAIN_SHIELD_TOKEN_ABI } from "./abis/ChainShieldToken";
import { L_P_TOKEN_ABI as LP_TOKEN_ABI } from "./abis/LPToken";
import { CHAIN_SHIELD_GOVERNOR_ABI } from "./abis/ChainShieldGovernor";

// Resolve addresses from environment variables or fall back to mock addresses for safety
export const CONTRACT_ADDRESSES = {
  POLICY_MANAGER: (import.meta.env.VITE_POLICY_MANAGER_ADDRESS || "0x1234567890AbcdEF1234567890AbCdef12345678") as string,
  INSURANCE_POOL: (import.meta.env.VITE_INSURANCE_POOL_ADDRESS || "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01") as string,
  CLAIMS_PROCESSOR: (import.meta.env.VITE_CLAIMS_PROCESSOR_ADDRESS || "0x9876543210fEdCbA9876543210FeDcBa98765432") as string,
  CST_TOKEN: (import.meta.env.VITE_CST_TOKEN_ADDRESS || "0x1111111111111111111111111111111111111111") as string,
  LP_TOKEN: (import.meta.env.VITE_LP_TOKEN_ADDRESS || "0x2222222222222222222222222222222222222222") as string,
  GOVERNOR: (import.meta.env.VITE_GOVERNOR_ADDRESS || "0x3333333333333333333333333333333333333333") as string,
};

// Strongly-typed Thirdweb v5 contract instances
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
