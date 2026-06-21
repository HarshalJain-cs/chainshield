import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { simulateTx, simulateFailedTx, formatTxHash, getEtherscanUrl, type TxStatus } from "@/lib/contracts/mockTx";

describe("formatTxHash", () => {
  it("truncates the middle of a hash", () => {
    const hash = "0x1234567890abcdef1234567890abcdef12345678";
    expect(formatTxHash(hash)).toBe("0x12345678...12345678");
  });
});

describe("getEtherscanUrl", () => {
  it("defaults to the Sepolia explorer", () => {
    expect(getEtherscanUrl("0xabc")).toBe("https://sepolia.etherscan.io/tx/0xabc");
  });
  it("uses mainnet explorer for chainId 1", () => {
    expect(getEtherscanUrl("0xabc", 1)).toBe("https://etherscan.io/tx/0xabc");
  });
});

describe("simulateTx", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("progresses through pending → confirming → success and returns a receipt", async () => {
    const statuses: TxStatus[] = [];
    const promise = simulateTx("purchasePolicy", (status) => statuses.push(status));
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(statuses).toEqual(["pending", "confirming", "success"]);
    expect(result.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.blockNumber).toBeGreaterThan(0);
    expect(Number(result.gasUsed)).toBeGreaterThan(0);
  });

  it("emits a tx hash on the first (pending) callback", async () => {
    let firstHash: string | undefined;
    const promise = simulateTx("submitClaim", (status, hash) => {
      if (status === "pending") firstHash = hash;
    });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(firstHash).toBe(result.txHash);
  });
});

describe("simulateFailedTx", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rejects with the provided reason", async () => {
    const promise = simulateFailedTx("Insufficient balance");
    const assertion = expect(promise).rejects.toThrow("Insufficient balance");
    await vi.runAllTimersAsync();
    await assertion;
  });
});
