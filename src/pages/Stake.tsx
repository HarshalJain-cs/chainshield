import { useState } from "react";
import { lineMeta, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Loader2 } from "lucide-react";
import { Window } from "@/components/Window";
import { usePools } from "@/hooks/usePools";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useStake, useUnstake } from "@/hooks/useStake";
import { TxStatusModal } from "@/components/web3/TxStatusModal";
import type { Id } from "../../convex/_generated/dataModel";
import { useAccount } from "wagmi";

const poolTypes = ["All", "DeFi", "Health", "Auto", "Life", "Mixed"] as const;

export default function Stake() {
  const [filter, setFilter] = useState<(typeof poolTypes)[number]>("All");
  const { pools, isLoading: poolsLoading } = usePools();
  const { positions } = useUserPositions();

  const filtered = pools.filter((p) => filter === "All" || p.poolType === filter);

  return (
    <div className="container py-10 space-y-8">
      <div>
        <span className="chip mb-2">Earn</span>
        <h1 className="font-display text-5xl md:text-7xl">Earn yield.</h1>
        <p className="text-foreground/70 mt-3 text-lg">Underwrite cover pools across every line. Earn premiums + protocol incentives.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b-[1.5px] border-foreground pb-4">
        {poolTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-[1.5px] border-foreground transition-smooth ${
              filter === t ? "bg-primary text-primary-foreground shadow-window-sm" : "bg-card hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {poolsLoading ? (
        <div className="flex items-center justify-center py-20 text-foreground/50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pool) => {
            const userPosition = positions.find((pos) => pos.poolId === pool._id);
            return <PoolCard key={pool._id} pool={pool} userPosition={userPosition} />;
          })}
        </div>
      )}
    </div>
  );
}

function PoolCard({ pool, userPosition }: { pool: any; userPosition?: any }) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState(1000);
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  
  const { stake, txStatus: stakeStatus, txHash: stakeHash, reset: resetStake } = useStake();
  const { unstake, txStatus: unstakeStatus, txHash: unstakeHash, reset: resetUnstake } = useUnstake();

  const [showTx, setShowTx] = useState(false);
  const [txType, setTxType] = useState<"stake" | "unstake" | null>(null);

  const projected = (amount * pool.apy) / 100;

  const handleStake = async () => {
    if (!isConnected) return;
    setTxType("stake");
    setShowTx(true);
    try {
      await stake(pool._id as Id<"pools">, amount, pool.acceptedTokens[0]);
    } catch (e) {
      // modal handles error
    }
  };

  const handleUnstake = async () => {
    if (!isConnected || !userPosition) return;
    setTxType("unstake");
    setShowTx(true);
    try {
      await unstake(userPosition._id as Id<"lpPositions">);
    } catch (e) {
      // modal handles error
    }
  };

  const handleCloseModal = () => {
    setShowTx(false);
    resetStake();
    resetUnstake();
    setTxType(null);
  };

  const activeStatus = txType === "stake" ? stakeStatus : unstakeStatus;
  const activeHash = txType === "stake" ? stakeHash : unstakeHash;

  return (
    <>
      <TxStatusModal
        open={showTx && activeStatus !== "idle"}
        onClose={handleCloseModal}
        status={activeStatus}
        txHash={activeHash}
        title={txType === "stake" ? "Depositing Liquidity" : "Withdrawing Liquidity"}
        successMessage={txType === "stake" ? "Successfully deposited into pool." : "Successfully withdrawn from pool."}
      />

      <Window title={pool.poolId} tag={pool.poolType} tagColor={pool.poolType === "Mixed" ? "primary" : "secondary"} hover>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold text-xs bg-muted">
                {pool.productId.slice(0, 3).toUpperCase()}
              </span>
              <div>
                <div className="font-display text-lg">{pool.name}</div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground">
                  {pool.poolType} · {pool.acceptedTokens.join(", ")}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-muted-foreground">APY</div>
              <div className="font-display text-2xl text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" />{pool.apy}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t-[1.5px] border-foreground">
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">TVL</div>
              <div className="font-display text-lg">{fmtUsd(pool.tvlUsd)}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Utilization</div>
              <div className="font-display text-lg">{pool.utilizationPct}%</div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "stake" | "unstake")}>
            <TabsList className="w-full bg-card border-[1.5px] border-foreground rounded-sm h-auto p-1">
              <TabsTrigger value="stake" className="flex-1">Stake</TabsTrigger>
              <TabsTrigger value="unstake" className="flex-1">Unstake</TabsTrigger>
            </TabsList>
            <TabsContent value="stake" className="space-y-3 mt-3">
              <div className="flex justify-between text-[10px] font-mono uppercase">
                <span>Amount (USD)</span><span>${amount.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={50000} step={100} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-primary" />
              <div className="border-[1.5px] border-foreground bg-muted/40 p-3 text-sm flex justify-between items-baseline">
                <span className="text-[10px] font-mono uppercase">Est. yearly rewards</span>
                <span className="font-display text-xl text-primary">${projected.toFixed(0)}</span>
              </div>
              <Button className="w-full" onClick={handleStake} disabled={!isConnected}>
                {isConnected ? "Stake Onchain" : "Connect Wallet"}
              </Button>
            </TabsContent>
            <TabsContent value="unstake" className="space-y-3 mt-3">
              <div className="text-sm">Your stake: <span className="font-mono">${(userPosition?.depositedAmountUsd || 0).toLocaleString()}</span></div>
              <Button className="w-full" variant="outline" disabled={!userPosition || !isConnected} onClick={handleUnstake}>
                Unstake Onchain
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </Window>
    </>
  );
}
