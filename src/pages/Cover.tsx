import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

const categories = ["All", "DEX", "Lending", "Staking", "Bridge", "Stablecoin", "Derivatives"] as const;
const chains = ["All", "Ethereum", "Arbitrum", "Base", "Optimism"] as const;
const risks = ["All", "Low", "Medium", "High"] as const;

export default function Cover() {
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [chain, setChain] = useState<(typeof chains)[number]>("All");
  const [risk, setRisk] = useState<(typeof risks)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      protocols.filter(
        (p) =>
          (cat === "All" || p.category === cat) &&
          (chain === "All" || p.chain === chain) &&
          (risk === "All" || p.risk === risk) &&
          (q === "" || p.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, chain, risk, q],
  );

  return (
    <div className="container py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Cover marketplace</h1>
        <p className="mt-2 text-muted-foreground text-lg">Browse and buy onchain insurance for {protocols.length} protocols across 4 chains.</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search protocols" className="pl-9 bg-card/50" />
          </div>
          <FilterGroup<(typeof categories)[number]> label="Category" options={categories} value={cat} onChange={setCat} />
          <FilterGroup<(typeof chains)[number]> label="Chain" options={chains} value={chain} onChange={setChain} />
          <FilterGroup<(typeof risks)[number]> label="Risk tier" options={risks} value={risk} onChange={setRisk} />
        </aside>

        <div>
          <div className="text-sm text-muted-foreground mb-4">{filtered.length} cover product{filtered.length === 1 ? "" : "s"}</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} to={`/cover/${p.id}`} className="block group">
                <div className="glass rounded-2xl p-5 transition-smooth hover:-translate-y-1 hover:border-primary/40">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm" style={{ background: `hsl(${p.color} / 0.15)`, color: `hsl(${p.color})`, border: `1px solid hsl(${p.color} / 0.35)` }}>
                        {p.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <div className="font-display font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category} · {p.chain}</div>
                      </div>
                    </div>
                    <RiskBadge risk={p.risk} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <Stat label="Premium" value={`${p.premium.toFixed(2)}%`} accent />
                    <Stat label="Capacity" value={fmtUsd(p.capacityUsd)} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Utilization</span>
                      <span className="font-mono">{p.utilizationPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p.utilizationPct}%`, background: "var(--gradient-primary)" }} />
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-smooth">
                    Get cover <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${
              value === o
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  } as const;
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${map[risk]}`}>{risk}</span>;
}