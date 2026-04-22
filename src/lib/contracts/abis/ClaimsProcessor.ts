// Mock ClaimsProcessor ABI
export const CLAIMS_PROCESSOR_ABI = [
  {
    name: "submitClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_policyId", type: "uint256" },
      { name: "_requestedAmount", type: "uint256" },
      { name: "_evidenceCIDs", type: "string[]" },
      { name: "_incidentData", type: "bytes" },
    ],
    outputs: [{ name: "claimId", type: "uint256" }],
  },
  {
    name: "approveClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "uint256" },
      { name: "approvedAmount", type: "uint256" },
      { name: "notes", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "rejectClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "claims",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "claimId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "policyId", type: "uint256" },
      { name: "claimant", type: "address" },
      { name: "requestedAmount", type: "uint256" },
      { name: "approvedAmount", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "oracleConfirmed", type: "bool" },
      { name: "submittedAt", type: "uint256" },
      { name: "resolvedAt", type: "uint256" },
    ],
  },
  {
    name: "ClaimSubmitted",
    type: "event",
    inputs: [
      { name: "claimId", type: "uint256", indexed: true },
      { name: "policyId", type: "uint256", indexed: true },
      { name: "claimant", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ClaimApproved",
    type: "event",
    inputs: [
      { name: "claimId", type: "uint256", indexed: true },
      { name: "approvedAmount", type: "uint256", indexed: false },
      { name: "reviewer", type: "address", indexed: false },
    ],
  },
] as const;
