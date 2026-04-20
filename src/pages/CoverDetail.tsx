import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShieldCheck, Clock, TrendingUp } from "lucide-react";
import { RiskBadge } from "./Cover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CoverDetail() {
  const { id } = useParams();
  const protocol = protocols.find((p) => p.id === id);
  const [amount, setAmount] = useState("10000");
  const [days, setDays] = useState(180);
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();

  const premium = useMemo(() => {
    if (!protocol) return 0;
    const a = parseFloat(amount) || 0;
    return (a * protocol.premium / 100) * (days / 365);
  }, [protocol, amount, days]);

  if (!protocol) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Protocol not found.</p>
        <Button asChild className="mt-4"><Link to="/cover">Back to marketplace</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-6xl">
      <Link to="/cover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div>
          <div className="flex items-start gap-4 mb-8">
            <span className="w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-bold" style={{ background: `hsl(${protocol.color} / 0.15)`, color: `hsl(${protocol.color})`, border: `1px solid hsl(${protocol.color} / 0.4)` }}>
              {protocol.symbol.slice(0, 3)}
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold">{protocol.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{protocol.category}</span><span>·</span><span>{protocol.chain}</span><span>·</span><RiskBadge risk={protocol.risk} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <MetricCard icon={TrendingUp} label="Annual premium" value={`${protocol.premium.toFixed(2)}%`} accent />
            <MetricCard icon={ShieldCheck} label="Available capacity" value={fmtUsd(protocol.capacityUsd * (1 - protocol.utilizationPct / 100))} />
            <MetricCard icon={Clock} label="Protocol TVL" value={fmtUsd(protocol.tvlUsd)} />
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">What's covered</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Smart-contract bugs and exploits affecting the protocol</li>
              <li>• Oracle manipulation causing irrecoverable loss of user funds</li>
              <li>• Governance attacks resulting in protocol-level losses</li>
              <li>• Validator slashing (for staking protocols)</li>
            </ul>
            <h3 className="font-display text-base font-semibold pt-2">What's not covered</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Phishing, key compromise or user-side errors</li>
              <li>• Economic / market loss unrelated to protocol failure</li>
              <li>• Frontend-only incidents resolvable by users</li>
            </ul>
          </div>
        </div>

        {/* Quote panel */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-xl font-semibold mb-4">Get a quote</h2>
            <label className="block text-xs text-muted-foreground mb-1.5">Cover amount (USD)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="font-mono mb-4" />

            <label className="block text-xs text-muted-foreground mb-1.5">Duration: <span className="font-mono text-foreground">{days} days</span></label>
            <input type="range" min={30} max={365} step={30} value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full accent-primary mb-6" />

            <div className="rounded-xl bg-muted/30 p-4 space-y-2">
              <Row label="Premium rate" value={`${protocol.premium.toFixed(2)}% APY`} />
              <Row label="Duration" value={`${days} days`} />
              <div className="border-t border-border my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Total premium</span>
                <span className="font-mono text-2xl font-bold text-primary">${premium.toFixed(2)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" onClick={() => setOpen(true)} disabled={!parseFloat(amount)}>
              Buy cover
            </Button>
            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center mt-3">Connect wallet to purchase</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Confirm cover purchase</DialogTitle>
            <DialogDescription>Review the details before signing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Row label="Protocol" value={protocol.name} />
            <Row label="Cover amount" value={`$${parseFloat(amount).toLocaleString()}`} />
            <Row label="Duration" value={`${days} days`} />
            <Row label="Premium" value={`$${premium.toFixed(2)}`} />
          </div>
          <DialogFooter>
            {isConnected ? (
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(false)}>
                Sign transaction (demo)
              </Button>
            ) : (
              <div className="w-full flex justify-center"><ConnectButton /></div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <Icon className={`h-4 w-4 mb-2 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-lg font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}