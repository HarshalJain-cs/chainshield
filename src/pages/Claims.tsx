import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { claims, policies, protocols, fmtUsd } from "@/lib/mock/data";
import { StatusBadge } from "./Dashboard";
import { Plus, Check } from "lucide-react";

export default function ClaimsPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Claims</h1>
          <p className="text-muted-foreground mt-1">File a claim or assess open ones to earn rewards.</p>
        </div>
        <FileClaimDialog />
      </div>

      <Tabs defaultValue="my">
        <TabsList className="bg-muted/40">
          <TabsTrigger value="my">My claims</TabsTrigger>
          <TabsTrigger value="open">Open assessments</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-6">
          <ClaimList list={claims} />
        </TabsContent>
        <TabsContent value="open" className="mt-6">
          <ClaimList list={claims.filter((c) => c.status === "Voting" || c.status === "Pending")} showVote />
        </TabsContent>
        <TabsContent value="resolved" className="mt-6">
          <ClaimList list={claims.filter((c) => c.status === "Approved" || c.status === "Rejected")} />
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
        const proto = protocols.find((p) => p.id === c.protocolId)!;
        const total = c.votesFor + c.votesAgainst;
        const forPct = total ? (c.votesFor / total) * 100 : 50;
        return (
          <div key={c.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold" style={{ background: `hsl(${proto.color} / 0.15)`, color: `hsl(${proto.color})` }}>
                  {proto.symbol.slice(0, 3)}
                </span>
                <div>
                  <div className="font-display font-semibold">{proto.name} · <span className="font-mono text-xs text-muted-foreground">{c.id}</span></div>
                  <div className="text-xs text-muted-foreground">Filed {c.filedAt} · Policy {c.policyId}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-primary">{fmtUsd(c.amountUsd)}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>For: <span className="font-mono text-success">{c.votesFor.toLocaleString()}</span></span>
                <span>Against: <span className="font-mono text-destructive">{c.votesAgainst.toLocaleString()}</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-destructive/30 overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${forPct}%` }} />
              </div>
            </div>
            {showVote && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-success/20 text-success border border-success/40 hover:bg-success/30">Vote approve</Button>
                <Button size="sm" variant="outline">Vote reject</Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FileClaimDialog() {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> File claim</Button>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">File a claim — Step {step} of 3</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Select policy</label>
            {policies.filter(p => p.status === "Active").map(p => {
              const proto = protocols.find(x => x.id === p.protocolId)!;
              return (
                <button key={p.id} className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 transition-smooth flex justify-between items-center">
                  <div>
                    <div className="font-medium">{proto.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.id}</div>
                  </div>
                  <div className="font-mono text-sm">{fmtUsd(p.amountUsd)}</div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Incident date</label>
              <Input type="date" className="font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Describe the incident</label>
              <Textarea rows={5} placeholder="What happened? Include tx hashes, links, evidence." />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold">Claim submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">Assessors will begin voting within 24h.</p>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button className="bg-primary text-primary-foreground" onClick={() => setStep(s => s + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}