import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { products, lineMeta, formatPremium, fmtUsd, type CoverageLine } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Window } from "@/components/Window";
import { Search, ArrowRight } from "lucide-react";

const lineTabs: ("all" | CoverageLine)[] = ["all", "defi", "health", "auto", "life", "finance", "travel"];
const tiers = ["All", "Basic", "Standard", "Premium"] as const;
const risks = ["All", "Low", "Medium", "High"] as const;

export default function Cover() {
  const [params, setParams] = useSearchParams();
  const initialLine = (params.get("line") as CoverageLine | null) ?? "all";
  const [line, setLine] = useState<"all" | CoverageLine>(initialLine);
  const [tier, setTier] = useState<(typeof tiers)[number]>("All");
  const [risk, setRisk] = useState<(typeof risks)[number]>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (line === "all") params.delete("line"); else params.set("line", line);
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (line === "all" || p.line === line) &&
          (tier === "All" || p.tier === tier) &&
          (risk === "All" || p.risk === risk) &&
          (q === "" || p.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [line, tier, risk, q],
  );

  return (
    <div className="container py-10">
      <div className="mb-8">
        <span className="chip mb-3">Marketplace</span>
        <h1 className="font-display text-5xl md:text-7xl">Cover marketplace.</h1>
        <p className="mt-3 text-foreground/70 text-lg">{products.length} products across 6 coverage lines — health, auto, life, travel, finance and DeFi.</p>
      </div>

      {/* Line tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6 border-b-[1.5px] border-foreground pb-4">
        {lineTabs.map((l) => (
          <button
            key={l}
            onClick={() => setLine(l)}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-[1.5px] border-foreground transition-smooth ${
              line === l ? "bg-primary text-primary-foreground shadow-window-sm" : "bg-card hover:bg-muted"
            }`}
          >
            {l === "all" ? "All" : lineMeta[l].label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside>
          <Window title="filters.cfg" tag="filter" tagColor="muted">
            <div className="p-4 space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9 bg-card border-foreground" />
              </div>
              <FilterGroup<(typeof tiers)[number]> label="Tier" options={tiers} value={tier} onChange={setTier} />
              <FilterGroup<(typeof risks)[number]> label="Risk tier" options={risks} value={risk} onChange={setRisk} />
            </div>
          </Window>
        </aside>

        <div>
          <div className="font-mono text-xs uppercase text-muted-foreground mb-4">{filtered.length} cover product{filtered.length === 1 ? "" : "s"}</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} to={`/cover/${p.id}`} className="block group">
                <Window title={p.id} tag={lineMeta[p.line].label} tagColor="muted" hover>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold text-xs" style={{ background: `hsl(${p.color} / 0.4)` }}>
                          {p.symbol.slice(0, 3)}
                        </span>
                        <div>
                          <div className="font-display text-lg leading-tight">{p.name}</div>
                          <div className="text-[10px] font-mono uppercase text-muted-foreground">{p.category} · {p.region}</div>
                        </div>
                      </div>
                      <RiskBadge risk={p.risk} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t-[1.5px] border-foreground">
                      <Stat label="Premium" value={formatPremium(p)} accent />
                      <Stat label="Capacity" value={fmtUsd(p.capacityUsd)} />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground mb-1.5">
                        <span>Utilization</span>
                        <span>{p.utilizationPct}%</span>
                      </div>
                      <div className="h-2 bg-muted border-[1.5px] border-foreground overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.utilizationPct}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center text-xs font-mono font-bold uppercase">
                      Get cover <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-smooth" />
                    </div>
                  </div>
                </Window>
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
      <div className="font-mono text-[10px] uppercase font-bold tracking-wider mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase border-[1.5px] border-foreground transition-smooth ${
              value === o ? "bg-primary text-primary-foreground shadow-window-sm" : "bg-card hover:bg-muted"
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
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className={`font-display text-lg ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-secondary text-foreground",
    Medium: "bg-[hsl(var(--warning))] text-foreground",
    High: "bg-destructive text-destructive-foreground",
  } as const;
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground ${map[risk]}`}>{risk}</span>;
}
