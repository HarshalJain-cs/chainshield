import { Link } from "react-router-dom";
import { proposals, fmtNum } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatusBadge } from "./Dashboard";

export default function Governance() {
  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Governance</h1>
          <p className="text-muted-foreground mt-1">Vote on parameters, treasury, and protocol upgrades.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Create proposal</Button>
      </div>

      <div className="glass rounded-2xl p-5 mb-8 grid grid-cols-3 gap-4 max-w-2xl">
        <Stat label="Your CSHD" value="12,450" />
        <Stat label="Voting power" value="0.04%" />
        <Stat label="Active proposals" value={proposals.filter(p => p.status === "Active").length.toString()} />
      </div>

      <div className="grid gap-3">
        {proposals.map((p) => {
          const total = p.votesFor + p.votesAgainst;
          const forPct = total ? (p.votesFor / total) * 100 : 50;
          return (
            <Link to={`/governance/${p.id}`} key={p.id} className="block group">
              <div className="glass rounded-2xl p-5 transition-smooth hover:border-primary/40">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-smooth">{p.title}</h3>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Ends in</div>
                    <div className="font-mono text-foreground">{p.endsIn}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{p.summary}</p>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-success font-mono">For {fmtNum(p.votesFor)}</span>
                    <span className="text-destructive font-mono">Against {fmtNum(p.votesAgainst)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-destructive/30 overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${forPct}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-xl font-bold">{value}</div>
    </div>
  );
}