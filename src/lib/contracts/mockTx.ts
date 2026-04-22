// Simulates an Ethereum transaction lifecycle for mock contracts.
// Returns a fake tx hash and resolves after a delay mimicking block confirmation.

export type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface MockTxResult {
  txHash: `0x${string}`;
  blockNumber: number;
  gasUsed: string;
}

function randomHex(bytes: number): string {
  const hex = [...Array(bytes * 2)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
  return hex;
}

/**
 * Simulates sending a transaction. Returns a fake txHash immediately,
 * then resolves with mock receipt after a delay.
 */
export async function simulateTx(
  actionName: string,
  onStatusChange?: (status: TxStatus, txHash?: string) => void
): Promise<MockTxResult> {
  const txHash = `0x${randomHex(32)}` as `0x${string}`;

  onStatusChange?.("pending", txHash);
  console.log(`[MockTx] ${actionName} submitted: ${txHash}`);

  // Simulate mempool wait (1-2s)
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

  onStatusChange?.("confirming", txHash);
  console.log(`[MockTx] ${actionName} confirming...`);

  // Simulate block confirmation (1-3s)
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

  const result: MockTxResult = {
    txHash,
    blockNumber: 6_800_000 + Math.floor(Math.random() * 1000),
    gasUsed: (80_000 + Math.floor(Math.random() * 40_000)).toString(),
  };

  onStatusChange?.("success", txHash);
  console.log(`[MockTx] ${actionName} mined in block ${result.blockNumber}`);

  return result;
}

/**
 * Simulates a failed transaction with a realistic error.
 */
export async function simulateFailedTx(reason = "Transaction reverted"): Promise<never> {
  await new Promise((r) => setTimeout(r, 800));
  throw new Error(reason);
}

export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function getEtherscanUrl(hash: string, chainId = 11155111): string {
  const base =
    chainId === 1
      ? "https://etherscan.io"
      : "https://sepolia.etherscan.io";
  return `${base}/tx/${hash}`;
}
