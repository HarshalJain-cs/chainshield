import { useState } from "react";
import { pools, protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

export default function Stake() {
  return (
    <div className="container py-12 space-y-10">
      <div>
        <h1 className="font-display text-4xl font-bold">Earn yield</h1>
        <p className="text-muted-foreground mt-2 text-lg">Underwrite cover pools. Earn premiums + protocol incentives.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => {
          const proto = protocols.find((p) => p.id === pool.protocolId)!;
          return <PoolCard key={pool.id} pool={pool} proto={proto} />;
        })}
      </div>
    </div>
  );
}

function PoolCard({ pool, proto }: { pool: (typeof pools)[number]; proto: (typeof protocols)[number] }) {
  const [amount, setAmount] = useState(1000);
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  const projected = (amount * pool.apy) / 100;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm" style={{ background: `hsl(${proto.color} / 0.15)`, color: `hsl(${proto.color})`, border: `1px solid hsl(${proto.color} / 0.4)` }}>
            {proto.symbol.slice(0, 3)}
          </span>
          <div>
            <div className="font-display font-semibold">{proto.name}</div>
            <div className="text-xs text-muted-foreground">{proto.chain}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">APY</div>
          <div className="font-mono text-lg font-bold text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" />{pool.apy}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">TVL</div>
          <div className="font-mono font-semibold">{fmtUsd(pool.tvlUsd)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Utilization</div>
          <div className="font-mono font-semibold">{pool.utilizationPct}%</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "stake" | "unstake")}>
        <TabsList className="w-full bg-muted/40">
          <TabsTrigger value="stake" className="flex-1">Stake</TabsTrigger>
          <TabsTrigger value="unstake" className="flex-1">Unstake</TabsTrigger>
        </TabsList>
        <TabsContent value="stake" className="space-y-3 mt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Amount</span><span className="font-mono">${amount.toLocaleString()}</span>
          </div>
          <input type="range" min={100} max={50000} step={100} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full accent-primary" />
          <div className="rounded-lg bg-muted/30 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Est. yearly rewards</span>
            <span className="font-mono text-primary font-bold">${projected.toFixed(0)}</span>
          </div>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Stake</Button>
        </TabsContent>
        <TabsContent value="unstake" className="space-y-3 mt-3">
          <div className="text-sm text-muted-foreground">Your stake: <span className="font-mono text-foreground">${(pool.myStakeUsd || 0).toLocaleString()}</span></div>
          <Button className="w-full" variant="outline" disabled={!pool.myStakeUsd}>Unstake</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}