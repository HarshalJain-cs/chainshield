import { Link, useParams } from "react-router-dom";
import { proposals, fmtNum } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Window } from "@/components/Window";

export default function ProposalDetail() {
  const { id } = useParams();
  const p = proposals.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Proposal not found.</p>
        <Button asChild className="mt-4"><Link to="/governance">Back</Link></Button>
      </div>
    );
  }
  const total = p.votesFor + p.votesAgainst;
  const forPct = total ? (p.votesFor / total) * 100 : 50;

  return (
    <div className="container py-10 max-w-5xl">
      <Link to="/governance" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase mb-6 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to governance
      </Link>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs uppercase font-bold">{p.id}</span>
            <StatusBadge status={p.status} />
          </div>
          <h1 className="font-display text-5xl md:text-6xl">{p.title}</h1>
          <p className="text-xs font-mono uppercase mt-3">Proposed by {p.author}</p>

          <div className="mt-8 space-y-4 text-foreground/80">
            <p>{p.summary}</p>
            <h3 className="font-display text-2xl text-foreground mt-6">Rationale</h3>
            <p>This proposal aims to evolve ChainShield's risk parameters in line with current market conditions and community feedback collected over the past quarter.</p>
            <h3 className="font-display text-2xl text-foreground mt-6">Implementation</h3>
            <p>If passed, the change will activate after a 48-hour timelock and be deployed to all supported chains.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <Window title="vote.cast" tag="vote" tagColor="primary" large>
            <div className="p-5">
              <h3 className="font-display text-xl mb-3">Cast your vote</h3>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Your voting power</div>
              <div className="font-display text-3xl mb-4">12,450 CSHD</div>
              <div className="space-y-2">
                <Button className="w-full bg-secondary text-foreground">Vote For</Button>
                <Button variant="outline" className="w-full">Vote Against</Button>
              </div>
            </div>
          </Window>
          <Window title="tally" tag="live" tagColor="muted">
            <div className="p-5">
              <h3 className="font-display text-xl mb-3">Tally</h3>
              <div className="flex justify-between text-[10px] font-mono uppercase mb-1.5">
                <span className="text-secondary">For {fmtNum(p.votesFor)}</span>
                <span className="text-destructive">Against {fmtNum(p.votesAgainst)}</span>
              </div>
              <div className="h-2 bg-destructive border-[1.5px] border-foreground overflow-hidden mb-3">
                <div className="h-full bg-secondary" style={{ width: `${forPct}%` }} />
              </div>
              <div className="text-[10px] font-mono uppercase">Quorum: <span>5.2M / 4.0M ✓</span></div>
              <div className="text-[10px] font-mono uppercase mt-1">Ends: <span>{p.endsIn}</span></div>
            </div>
          </Window>
        </aside>
      </div>
    </div>
  );
}