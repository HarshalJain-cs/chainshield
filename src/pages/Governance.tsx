import { Link } from "react-router-dom";
import { proposals, fmtNum } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Window } from "@/components/Window";

export default function Governance() {
  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="chip mb-2">DAO</span>
          <h1 className="font-display text-5xl md:text-6xl">Governance.</h1>
          <p className="text-foreground/70 mt-2">Vote on parameters, treasury, and protocol upgrades.</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Create proposal</Button>
      </div>

      <Window title="voter.snapshot" tag="you" tagColor="primary" className="mb-8 max-w-2xl">
        <div className="p-5 grid grid-cols-3 gap-4">
          <Stat label="Your CSHD" value="12,450" />
          <Stat label="Voting power" value="0.04%" />
          <Stat label="Active proposals" value={proposals.filter(p => p.status === "Active").length.toString()} />
        </div>
      </Window>

      <div className="grid gap-3">
        {proposals.map((p) => {
          const total = p.votesFor + p.votesAgainst;
          const forPct = total ? (p.votesFor / total) * 100 : 50;
          return (
            <Link to={`/governance/${p.id}`} key={p.id} className="block group">
              <Window title={p.id} tag={p.status} tagColor={p.status === "Active" ? "primary" : p.status === "Passed" ? "secondary" : "muted"} hover>
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="font-display text-2xl group-hover:text-primary transition-smooth">{p.title}</h3>
                    <div className="text-right text-[10px] font-mono uppercase">
                      <div className="text-muted-foreground">Ends in</div>
                      <div>{p.endsIn}</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mb-4">{p.summary}</p>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono uppercase mb-1.5">
                      <span className="text-secondary">For {fmtNum(p.votesFor)}</span>
                      <span className="text-destructive">Against {fmtNum(p.votesAgainst)}</span>
                    </div>
                    <div className="h-2 bg-destructive border-[1.5px] border-foreground overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${forPct}%` }} />
                    </div>
                  </div>
                </div>
              </Window>
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
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}