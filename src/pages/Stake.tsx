import { useState } from "react";
import { pools, products, lineMeta, fmtUsd, type Pool } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { Window } from "@/components/Window";

const poolTypes = ["All", "DeFi", "Health", "Auto", "Life", "Mixed"] as const;

export default function Stake() {
  const [filter, setFilter] = useState<(typeof poolTypes)[number]>("All");
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pool) => {
          const product = products.find((p) => p.id === pool.productId)!;
          return <PoolCard key={pool.id} pool={pool} product={product} />;
        })}
      </div>
    </div>
  );
}

function PoolCard({ pool, product }: { pool: Pool; product: (typeof products)[number] }) {
  const [amount, setAmount] = useState(1000);
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  const projected = (amount * pool.apy) / 100;

  return (
    <Window title={pool.id} tag={pool.poolType} tagColor={pool.poolType === "Mixed" ? "primary" : "secondary"} hover>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold text-xs" style={{ background: `hsl(${product.color} / 0.4)` }}>
              {product.symbol.slice(0, 3)}
            </span>
            <div>
              <div className="font-display text-lg">{pool.name}</div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">{lineMeta[product.line].label} · {pool.acceptedTokens.join(", ")}</div>
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
              <span>Amount</span><span>${amount.toLocaleString()}</span>
            </div>
            <input type="range" min={100} max={50000} step={100} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-primary" />
            <div className="border-[1.5px] border-foreground bg-muted/40 p-3 text-sm flex justify-between items-baseline">
              <span className="text-[10px] font-mono uppercase">Est. yearly rewards</span>
              <span className="font-display text-xl text-primary">${projected.toFixed(0)}</span>
            </div>
            <Button className="w-full">Stake</Button>
          </TabsContent>
          <TabsContent value="unstake" className="space-y-3 mt-3">
            <div className="text-sm">Your stake: <span className="font-mono">${(pool.myStakeUsd || 0).toLocaleString()}</span></div>
            <Button className="w-full" variant="outline" disabled={!pool.myStakeUsd}>Unstake</Button>
          </TabsContent>
        </Tabs>
      </div>
    </Window>
  );
}
