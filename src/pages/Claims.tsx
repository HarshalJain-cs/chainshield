import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { claims, policies, protocols, fmtUsd } from "@/lib/mock/data";
import { StatusBadge } from "./Dashboard";
import { Plus, Check } from "lucide-react";
import { Window } from "@/components/Window";

export default function ClaimsPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="chip mb-2">Claims</span>
          <h1 className="font-display text-5xl md:text-6xl">Claims.</h1>
          <p className="text-foreground/70 mt-2">File a claim or assess open ones to earn rewards.</p>
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
          <Window key={c.id} title={c.id} tag={c.status} tagColor={c.status === "Approved" ? "secondary" : c.status === "Rejected" ? "muted" : "primary"}>
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 border-[1.5px] border-foreground flex items-center justify-center text-[10px] font-mono font-bold" style={{ background: `hsl(${proto.color} / 0.4)` }}>
                    {proto.symbol.slice(0, 3)}
                  </span>
                  <div>
                    <div className="font-display text-xl">{proto.name}</div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">Filed {c.filedAt} · Policy {c.policyId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl text-primary">{fmtUsd(c.amountUsd)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-4">{c.description}</p>
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1.5">
                  <span>For: <span className="text-secondary">{c.votesFor.toLocaleString()}</span></span>
                  <span>Against: <span className="text-destructive">{c.votesAgainst.toLocaleString()}</span></span>
                </div>
                <div className="h-2 bg-destructive border-[1.5px] border-foreground overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${forPct}%` }} />
                </div>
              </div>
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
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> File claim</Button>
      </DialogTrigger>
      <DialogContent className="window-lg bg-card">
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
              const proto = protocols.find(x => x.id === p.protocolId)!;
              return (
                <button key={p.id} className="w-full text-left p-3 border-[1.5px] border-foreground hover:bg-primary hover:text-primary-foreground transition-smooth flex justify-between items-center">
                  <div>
                    <div className="font-display text-lg">{proto.name}</div>
                    <div className="text-[10px] font-mono uppercase">{p.id}</div>
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
              <label className="text-[10px] font-mono uppercase font-bold">Incident date</label>
              <Input type="date" className="font-mono border-foreground" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase font-bold">Describe the incident</label>
              <Textarea rows={5} placeholder="What happened? Include tx hashes, links, evidence." className="border-foreground" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-secondary border-[1.5px] border-foreground shadow-window-sm flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl">Claim submitted</h3>
            <p className="text-sm text-foreground/70 mt-1">Assessors will begin voting within 24h.</p>
          </div>
        )}

        <div className="flex justify-between mt-4 pt-4 border-t-[1.5px] border-foreground">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}