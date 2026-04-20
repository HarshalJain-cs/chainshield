import { Link, useParams } from "react-router-dom";
import { proposals, fmtNum } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "./Dashboard";

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
    <div className="container py-12 max-w-5xl">
      <Link to="/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to governance
      </Link>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
            <StatusBadge status={p.status} />
          </div>
          <h1 className="font-display text-4xl font-bold">{p.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono">Proposed by {p.author}</p>

          <div className="prose prose-invert mt-8 text-muted-foreground">
            <p>{p.summary}</p>
            <h3 className="font-display text-foreground mt-6 mb-2">Rationale</h3>
            <p>This proposal aims to evolve ChainShield's risk parameters in line with current market conditions and community feedback collected over the past quarter.</p>
            <h3 className="font-display text-foreground mt-6 mb-2">Implementation</h3>
            <p>If passed, the change will activate after a 48-hour timelock and be deployed to all supported chains.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold mb-3">Cast your vote</h3>
            <div className="text-xs text-muted-foreground mb-1">Your voting power</div>
            <div className="font-mono text-2xl font-bold mb-4">12,450 CSHD</div>
            <div className="space-y-2">
              <Button className="w-full bg-success/20 text-success border border-success/40 hover:bg-success/30">Vote For</Button>
              <Button variant="outline" className="w-full">Vote Against</Button>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold mb-3">Tally</h3>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-success font-mono">For {fmtNum(p.votesFor)}</span>
              <span className="text-destructive font-mono">Against {fmtNum(p.votesAgainst)}</span>
            </div>
            <div className="h-2 rounded-full bg-destructive/30 overflow-hidden mb-3">
              <div className="h-full bg-success" style={{ width: `${forPct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground">Quorum: <span className="font-mono text-foreground">5.2M / 4.0M ✓</span></div>
            <div className="text-xs text-muted-foreground mt-1">Ends: <span className="font-mono text-foreground">{p.endsIn}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}