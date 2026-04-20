import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { claims, policies, products, lineMeta, fmtUsd, type CoverageLine } from "@/lib/mock/data";
import { StatusBadge } from "./Dashboard";
import { Plus, Check } from "lucide-react";
import { Window } from "@/components/Window";

const openStatuses = new Set(["Submitted", "Oracle check", "Manual review"]);
const resolvedStatuses = new Set(["Approved", "Rejected", "Auto-approved", "Paid"]);

export default function ClaimsPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="chip mb-2">Claims</span>
          <h1 className="font-display text-5xl md:text-6xl">Claims.</h1>
          <p className="text-foreground/70 mt-2">File a claim across any line, or assess open ones to earn rewards.</p>
        </div>
        <FileClaimDialog />
      </div>

      <Tabs defaultValue="my">
        <TabsList className="bg-card border-[1.5px] border-foreground rounded-sm h-auto p-1">
          <TabsTrigger value="my">My claims</TabsTrigger>
          <TabsTrigger value="open">Open assessments</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-6">
          <ClaimList list={claims} />
        </TabsContent>
        <TabsContent value="open" className="mt-6">
          <ClaimList list={claims.filter((c) => openStatuses.has(c.status))} showVote />
        </TabsContent>
        <TabsContent value="resolved" className="mt-6">
          <ClaimList list={claims.filter((c) => resolvedStatuses.has(c.status))} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClaimList({ list, showVote }: { list: typeof claims; showVote?: boolean }) {
  if (list.length === 0) return <div className="text-muted-foreground text-sm">No claims here.</div>;
  return (
    <div className="grid gap-3">
      {list.map((c) => {
        const product = products.find((p) => p.id === c.productId)!;
        const total = c.votesFor + c.votesAgainst;
        const forPct = total ? (c.votesFor / total) * 100 : 50;
        const tagColor = c.status === "Approved" || c.status === "Paid" || c.status === "Auto-approved" ? "secondary" : c.status === "Rejected" ? "muted" : "primary";
        return (
          <Window key={c.id} title={c.id} tag={lineMeta[c.claimType].label} tagColor={tagColor}>
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 border-[1.5px] border-foreground flex items-center justify-center text-[10px] font-mono font-bold" style={{ background: `hsl(${product.color} / 0.4)` }}>
                    {product.symbol.slice(0, 3)}
                  </span>
                  <div>
                    <div className="font-display text-xl">{product.name}</div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">Filed {c.filedAt} · Policy {c.policyId} · {c.incidentType}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-primary">{fmtUsd(c.amountUsd)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-4">{c.description}</p>
              {c.oracleVerdict && c.oracleVerdict !== "n/a" && (
                <div className="text-[10px] font-mono uppercase mb-3">
                  Oracle verdict: <span className={c.oracleVerdict === "pass" ? "text-secondary" : "text-destructive"}>{c.oracleVerdict.toUpperCase()}</span>
                </div>
              )}
              {total > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase mb-1.5">
                    <span>For: <span className="text-secondary">{c.votesFor.toLocaleString()}</span></span>
                    <span>Against: <span className="text-destructive">{c.votesAgainst.toLocaleString()}</span></span>
                  </div>
                  <div className="h-2 bg-destructive border-[1.5px] border-foreground overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${forPct}%` }} />
                  </div>
                </div>
              )}
              {showVote && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="bg-secondary text-foreground">Vote approve</Button>
                  <Button size="sm" variant="outline">Vote reject</Button>
                </div>
              )}
            </div>
          </Window>
        );
      })}
    </div>
  );
}

function FileClaimDialog() {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);
  const line: CoverageLine | undefined = selectedPolicy?.coverageType;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep(1); setSelectedPolicyId(null); } }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> File claim</Button>
      </DialogTrigger>
      <DialogContent className="window-lg bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">File a claim — Step {step}/3</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-2 border-y-[1.5px] border-foreground py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 border-[1.5px] border-foreground ${s <= step ? "bg-primary" : "bg-card"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase font-bold">Select policy</label>
            {policies.filter(p => p.status === "Active").map(p => {
              const product = products.find(x => x.id === p.productId)!;
              const active = selectedPolicyId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPolicyId(p.id)}
                  className={`w-full text-left p-3 border-[1.5px] border-foreground transition-smooth flex justify-between items-center ${active ? "bg-primary text-primary-foreground shadow-window-sm" : "hover:bg-muted"}`}
                >
                  <div>
                    <div className="font-display text-lg">{product.name}</div>
                    <div className="text-[10px] font-mono uppercase">{p.id} · {lineMeta[p.coverageType].label}</div>
                  </div>
                  <div className="font-mono text-sm">{fmtUsd(p.amountUsd)}</div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && line && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase">Coverage line: <span className="text-primary">{lineMeta[line].label}</span></div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold">Incident date</label>
              <Input type="date" className="font-mono border-foreground" />
            </div>

            {line === "defi" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Incident tx hash</label>
                  <Input placeholder="0x…" className="font-mono border-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Affected contract</label>
                  <Input placeholder="0x…" className="font-mono border-foreground" />
                </div>
              </>
            )}

            {line === "health" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Provider name</label>
                  <Input placeholder="Hospital / clinic" className="border-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold">Treatment from</label>
                    <Input type="date" className="font-mono border-foreground" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold">Treatment to</label>
                    <Input type="date" className="font-mono border-foreground" />
                  </div>
                </div>
              </>
            )}

            {line === "auto" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Police report #</label>
                  <Input placeholder="A-12345" className="font-mono border-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Repair estimate (USD)</label>
                  <Input type="number" placeholder="0" className="font-mono border-foreground" />
                </div>
              </>
            )}

            {line === "life" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Beneficiary wallet</label>
                  <Input placeholder="0x…" className="font-mono border-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Death certificate hash (IPFS)</label>
                  <Input placeholder="ipfs://…" className="font-mono border-foreground" />
                </div>
              </>
            )}

            {line === "travel" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Reason</label>
                  <Input placeholder="Cancellation / medical / lost luggage" className="border-foreground" />
                </div>
              </>
            )}

            {line === "finance" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Compromised wallet / exchange</label>
                  <Input placeholder="0x… or exchange name" className="font-mono border-foreground" />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-mono uppercase font-bold">Describe the incident</label>
              <Textarea rows={4} placeholder="What happened? Include evidence, links, attachments." className="border-foreground" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-secondary border-[1.5px] border-foreground shadow-window-sm flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl">Claim submitted</h3>
            <p className="text-sm text-foreground/70 mt-1">Oracle check begins immediately. Manual review (if any) within 24h.</p>
          </div>
        )}

        <div className="flex justify-between mt-4 pt-4 border-t-[1.5px] border-foreground">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !selectedPolicyId}>Next</Button>
          ) : (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
