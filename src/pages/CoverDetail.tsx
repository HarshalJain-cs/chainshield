import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Window } from "@/components/Window";
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
        <p className="text-foreground/70">Protocol not found.</p>
        <Button asChild className="mt-4"><Link to="/cover">Back to marketplace</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-6xl">
      <Link to="/cover" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase mb-6 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div>
          <div className="flex items-start gap-4 mb-8">
            <span className="w-16 h-16 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold shadow-window-sm" style={{ background: `hsl(${protocol.color} / 0.4)` }}>
              {protocol.symbol.slice(0, 3)}
            </span>
            <div>
              <h1 className="font-display text-5xl">{protocol.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono uppercase">
                <span>{protocol.category}</span><span>·</span><span>{protocol.chain}</span><span>·</span><RiskBadge risk={protocol.risk} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <MetricCard icon={TrendingUp} label="Annual premium" value={`${protocol.premium.toFixed(2)}%`} accent />
            <MetricCard icon={ShieldCheck} label="Available capacity" value={fmtUsd(protocol.capacityUsd * (1 - protocol.utilizationPct / 100))} />
            <MetricCard icon={Clock} label="Protocol TVL" value={fmtUsd(protocol.tvlUsd)} />
          </div>

          <Window title="coverage.terms" tag="terms" tagColor="muted">
            <div className="p-6 space-y-4">
              <h2 className="font-display text-2xl">What's covered</h2>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex gap-2"><span className="text-secondary">▸</span> Smart-contract bugs and exploits affecting the protocol</li>
                <li className="flex gap-2"><span className="text-secondary">▸</span> Oracle manipulation causing irrecoverable loss of user funds</li>
                <li className="flex gap-2"><span className="text-secondary">▸</span> Governance attacks resulting in protocol-level losses</li>
                <li className="flex gap-2"><span className="text-secondary">▸</span> Validator slashing (for staking protocols)</li>
              </ul>
              <h3 className="font-display text-xl pt-2">What's not covered</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex gap-2"><span className="text-destructive">▸</span> Phishing, key compromise or user-side errors</li>
                <li className="flex gap-2"><span className="text-destructive">▸</span> Economic / market loss unrelated to protocol failure</li>
                <li className="flex gap-2"><span className="text-destructive">▸</span> Frontend-only incidents resolvable by users</li>
              </ul>
            </div>
          </Window>
        </div>

        {/* Quote panel */}
        <div>
          <div className="sticky top-28">
            <Window title="quote.calculator" tag="quote" tagColor="primary" large>
              <div className="p-6">
                <h2 className="font-display text-2xl mb-4">Get a quote</h2>
                <label className="block text-[10px] font-mono uppercase font-bold mb-1.5">Cover amount (USD)</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="font-mono mb-4 border-foreground" />

                <label className="block text-[10px] font-mono uppercase font-bold mb-1.5">Duration: <span className="text-primary">{days} days</span></label>
                <input type="range" min={30} max={365} step={30} value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full accent-primary mb-6" />

                <div className="border-[1.5px] border-foreground bg-muted/40 p-4 space-y-2">
                  <Row label="Premium rate" value={`${protocol.premium.toFixed(2)}% APY`} />
                  <Row label="Duration" value={`${days} days`} />
                  <div className="border-t-[1.5px] border-foreground my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-mono uppercase">Total premium</span>
                    <span className="font-display text-3xl text-primary">${premium.toFixed(2)}</span>
                  </div>
                </div>

                <Button size="lg" className="w-full mt-4" onClick={() => setOpen(true)} disabled={!parseFloat(amount)}>
                  Buy cover
                </Button>
                {!isConnected && (
                  <p className="text-[10px] font-mono uppercase text-center mt-3 text-muted-foreground">Connect wallet to purchase</p>
                )}
              </div>
            </Window>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="window-lg bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">Confirm cover purchase</DialogTitle>
            <DialogDescription>Review the details before signing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 border-y-[1.5px] border-foreground">
            <Row label="Protocol" value={protocol.name} />
            <Row label="Cover amount" value={`$${parseFloat(amount).toLocaleString()}`} />
            <Row label="Duration" value={`${days} days`} />
            <Row label="Premium" value={`$${premium.toFixed(2)}`} />
          </div>
          <DialogFooter>
            {isConnected ? (
              <Button className="w-full" onClick={() => setOpen(false)}>
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
    <Window>
      <div className="p-4">
        <Icon className={`h-4 w-4 mb-2 ${accent ? "text-primary" : ""}`} />
        <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
        <div className={`font-display text-2xl ${accent ? "text-primary" : ""}`}>{value}</div>
      </div>
    </Window>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-foreground/70 font-mono text-xs uppercase">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}