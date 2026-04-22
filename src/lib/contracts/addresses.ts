// Mock contract addresses (Sepolia testnet)
// Replace with real deployed addresses when available
export const CONTRACT_ADDRESSES = {
  // Sepolia (11155111)
  11155111: {
    POLICY_MANAGER:  "0x1234567890AbcdEF1234567890AbCdef12345678" as `0x${string}`,
    INSURANCE_POOL:  "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01" as `0x${string}`,
    CLAIMS_PROCESSOR:"0x9876543210fEdCbA9876543210FeDcBa98765432" as `0x${string}`,
    PREMIUM_VAULT:   "0xDeAdBeEf00000000000000000000000000000001" as `0x${string}`,
  },
  // Mainnet (1) — placeholder
  1: {
    POLICY_MANAGER:  "0x0000000000000000000000000000000000000000" as `0x${string}`,
    INSURANCE_POOL:  "0x0000000000000000000000000000000000000000" as `0x${string}`,
    CLAIMS_PROCESSOR:"0x0000000000000000000000000000000000000000" as `0x${string}`,
    PREMIUM_VAULT:   "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const;

// Token addresses on Sepolia
export const TOKEN_ADDRESSES = {
  ETH:  "0x0000000000000000000000000000000000000000" as `0x${string}`, // native
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`, // Sepolia USDC
  DAI:  "0x68194a729C2450ad26072b3D33ADaCbcef39D574" as `0x${string}`, // Sepolia DAI
} as const;

export const ACTIVE_CHAIN_ID = 11155111; // Sepolia for testing
