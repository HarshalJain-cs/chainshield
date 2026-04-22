import { useState } from "react";
import { useMutation } from "convex/react";
import { useAccount } from "wagmi";
import { api } from "../../convex/_generated/api";
import { simulateTx, type TxStatus } from "@/lib/contracts/mockTx";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Hook for staking (depositing) into a liquidity pool.
 */
export function useStake() {
  const { address } = useAccount();
  const deposit = useMutation(api.lp.deposit);

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stake = async (
    poolDocId: Id<"pools">,
    amountUsd: number,
    token: string
  ) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      const result = await simulateTx("deposit", (status, hash) => {
        setTxStatus(status);
        if (hash) setTxHash(hash);
      });

      await deposit({
        poolDocId,
        lpAddress: address,
        depositedAmountUsd: amountUsd,
        depositedToken: token,
        txHash: result.txHash,
      });

      return result;
    } catch (err: any) {
      setError(err.message ?? "Deposit failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
  };

  return { stake, txStatus, txHash, error, reset };
}

/**
 * Hook for unstaking (withdrawing) from a liquidity pool.
 */
export function useUnstake() {
  const { address } = useAccount();
  const withdraw = useMutation(api.lp.withdraw);

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unstake = async (positionId: Id<"lpPositions">) => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setTxStatus("pending");

    try {
      const result = await simulateTx("withdraw", (status, hash) => {
        setTxStatus(status);
        if (hash) setTxHash(hash);
      });

      await withdraw({ positionId, lpAddress: address });
      return result;
    } catch (err: any) {
      setError(err.message ?? "Withdrawal failed");
      setTxStatus("error");
      throw err;
    }
  };

  const reset = () => {
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
  };

  return { unstake, txStatus, txHash, error, reset };
}
