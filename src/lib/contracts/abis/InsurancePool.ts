// Mock InsurancePool ABI
export const INSURANCE_POOL_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "shares", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getUtilizationRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "pools",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "poolType", type: "uint8" },
      { name: "totalLiquidity", type: "uint256" },
      { name: "utilizedAmount", type: "uint256" },
      { name: "lockPeriodDays", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    name: "LiquidityAdded",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "lp", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    name: "LiquidityRemoved",
    type: "event",
    inputs: [
      { name: "poolId", type: "uint256", indexed: true },
      { name: "lp", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
