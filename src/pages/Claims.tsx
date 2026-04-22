import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { lineMeta, fmtUsd, type CoverageLine } from "@/lib/mock/data";
import { StatusBadge } from "./Dashboard";
import { Plus, Check, Loader2 } from "lucide-react";
import { Window } from "@/components/Window";
import { useUserClaims, useAllClaims } from "@/hooks/useClaims";
import { useUserPolicies } from "@/hooks/useUserPolicies";
import { useSubmitClaim } from "@/hooks/useSubmitClaim";
import { TxStatusModal } from "@/components/web3/TxStatusModal";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAccount } from "wagmi";
import type { Id } from "../../convex/_generated/dataModel";

const openStatuses = new Set(["Submitted", "Oracle check", "Manual review"]);
const resolvedStatuses = new Set(["Approved", "Rejected", "Auto-approved", "Paid"]);

const coverageTypeToLine: Record<string, CoverageLine> = {
  defi_smart_contract: "defi",
  defi_protocol_hack: "defi",
  defi_oracle_failure: "defi",
  health_basic: "health",
  health_standard: "health",
  health_premium: "health",
  life_term: "life",
  auto_liability: "auto",
  auto_full: "auto",
  auto_ev: "auto",
  finance_wallet: "finance",
  finance_cex: "finance",
  travel_basic: "travel",
  travel_medical: "travel",
};

export default function ClaimsPage() {
  const { claims: myClaims, isLoading } = useUserClaims();
  const { claims: allClaims } = useAllClaims();

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

      {isLoading ? (
        <div className="flex items-center gap-2 text-foreground/50 py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading claims...
        </div>
      ) : (
        <Tabs defaultValue="my">
          <TabsList className="bg-card border-[1.5px] border-foreground rounded-sm h-auto p-1">
            <TabsTrigger value="my">My claims</TabsTrigger>
            <TabsTrigger value="open">Open assessments</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-6">
            <ClaimList list={myClaims} />
          </TabsContent>
          <TabsContent value="open" className="mt-6">
            <ClaimList
              list={allClaims.filter((c) => openStatuses.has(c.status))}
              showVote
            />
          </TabsContent>
          <TabsContent value="resolved" className="mt-6">
            <ClaimList
              list={allClaims.filter((c) => resolvedStatuses.has(c.status))}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ClaimList({
  list,
  showVote,
}: {
  list: any[];
  showVote?: boolean;
}) {
  const voteOnClaim = useMutation(api.claims.voteOnClaim);

  if (list.length === 0)
    return <div className="text-muted-foreground text-sm py-8">No claims here.</div>;

  return (
    <div className="grid gap-3">
      {list.map((c) => {
        const claimLine: CoverageLine = c.claimType in lineMeta
          ? (c.claimType as CoverageLine)
          : "defi";
        const total = c.votesFor + c.votesAgainst;
        const forPct = total ? (c.votesFor / total) * 100 : 50;
        const tagColor =
          ["Approved", "Paid", "Auto-approved"].includes(c.status)
            ? "secondary"
            : c.status === "Rejected"
            ? "muted"
            : "primary";

        return (
          <Window key={c._id} title={`C-${c.onchainClaimId ?? c._id.slice(-6)}`} tag={lineMeta[claimLine]?.label ?? c.claimType} tagColor={tagColor}>
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-display text-xl">{c.incidentType}</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">
                    Filed {new Date(c.createdAt).toLocaleDateString()} · {c.claimType}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-primary">{fmtUsd(c.requestedAmountUsd)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>

              <p className="text-sm text-foreground/80 mb-4">{c.description}</p>

              {c.oracleVerdict && c.oracleVerdict !== "n/a" && (
                <div className="text-[10px] font-mono uppercase mb-3">
                  Oracle verdict:{" "}
                  <span className={c.oracleVerdict === "pass" ? "text-secondary" : "text-destructive"}>
                    {c.oracleVerdict.toUpperCase()}
                  </span>
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
                  <Button
                    size="sm"
                    className="bg-secondary text-foreground"
                    onClick={() => voteOnClaim({ id: c._id as Id<"claims">, vote: "for" })}
                  >
                    Vote approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => voteOnClaim({ id: c._id as Id<"claims">, vote: "against" })}
                  >
                    Vote reject
                  </Button>
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
  const { address } = useAccount();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [showTx, setShowTx] = useState(false);

  // Form fields
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incidentTx, setIncidentTx] = useState("");
  const [affectedContract, setAffectedContract] = useState("");
  const [providerName, setProviderName] = useState("");
  const [treatmentFrom, setTreatmentFrom] = useState("");
  const [treatmentTo, setTreatmentTo] = useState("");
  const [policeReport, setPoliceReport] = useState("");

  const { policies } = useUserPolicies();
  const { submit, txStatus, txHash, reset } = useSubmitClaim();

  const activePolicies = policies.filter((p) => p.status === "active");
  const selectedPolicy = activePolicies.find((p) => p._id === selectedPolicyId);
  const line: CoverageLine | undefined = selectedPolicy
    ? coverageTypeToLine[selectedPolicy.coverageType]
    : undefined;

  const handleClose = (v: boolean) => {
    if (!v) {
      setOpen(false);
      setStep(1);
      setSelectedPolicyId(null);
      reset();
    }
  };

  const handleSubmit = async () => {
    if (!selectedPolicy || !address) return;
    setShowTx(true);
    try {
      await submit({
        policyId: selectedPolicy._id as Id<"policies">,
        claimType: selectedPolicy.coverageType.split("_")[0],
        incidentType: line === "defi" ? "Smart contract exploit" : line === "health" ? "Medical claim" : "Insurance claim",
        incidentDate,
        description,
        requestedAmountUsd: parseFloat(amount) || 0,
        incidentTxHash: incidentTx || undefined,
        affectedContract: affectedContract || undefined,
        providerName: providerName || undefined,
        treatmentFrom: treatmentFrom || undefined,
        treatmentTo: treatmentTo || undefined,
        policeReport: policeReport || undefined,
      });
      setStep(3);
    } catch (e) {
      // error shown in modal
    }
  };

  return (
    <>
      <TxStatusModal
        open={showTx && txStatus !== "idle" && step !== 3}
        onClose={() => { setShowTx(false); reset(); }}
        status={txStatus}
        txHash={txHash}
        title="Submitting claim"
        successMessage="Claim submitted onchain. Oracle check begins immediately."
        onSuccess={() => { setShowTx(false); setStep(3); }}
      />

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> File claim</Button>
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
              {activePolicies.length === 0 ? (
                <p className="text-sm text-foreground/50">No active policies found. Buy coverage first.</p>
              ) : (
                activePolicies.map((p) => {
                  const active = selectedPolicyId === p._id;
                  return (
                    <button
                      key={p._id}
                      onClick={() => setSelectedPolicyId(p._id)}
                      className={`w-full text-left p-3 border-[1.5px] border-foreground transition-smooth flex justify-between items-center ${active ? "bg-primary text-primary-foreground shadow-window-sm" : "hover:bg-muted"}`}
                    >
                      <div>
                        <div className="font-display text-lg">{p.productId}</div>
                        <div className="text-[10px] font-mono uppercase">{p.coverageType}</div>
                      </div>
                      <div className="font-mono text-sm">{fmtUsd(p.coverageAmountUsd)}</div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {step === 2 && line && (
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase">Coverage line: <span className="text-primary">{lineMeta[line]?.label ?? line}</span></div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold">Incident date</label>
                <Input type="date" className="font-mono border-foreground" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold">Requested amount (USD)</label>
                <Input type="number" placeholder="0" className="font-mono border-foreground" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              {line === "defi" && (
                <>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold">Incident tx hash</label>
                    <Input placeholder="0x…" className="font-mono border-foreground" value={incidentTx} onChange={(e) => setIncidentTx(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold">Affected contract</label>
                    <Input placeholder="0x…" className="font-mono border-foreground" value={affectedContract} onChange={(e) => setAffectedContract(e.target.value)} />
                  </div>
                </>
              )}

              {line === "health" && (
                <>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold">Provider name</label>
                    <Input placeholder="Hospital / clinic" className="border-foreground" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold">Treatment from</label>
                      <Input type="date" className="font-mono border-foreground" value={treatmentFrom} onChange={(e) => setTreatmentFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold">Treatment to</label>
                      <Input type="date" className="font-mono border-foreground" value={treatmentTo} onChange={(e) => setTreatmentTo(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {line === "auto" && (
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold">Police report #</label>
                  <Input placeholder="A-12345" className="font-mono border-foreground" value={policeReport} onChange={(e) => setPoliceReport(e.target.value)} />
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase font-bold">Describe the incident</label>
                <Textarea rows={4} placeholder="What happened? Include evidence, links, attachments." className="border-foreground" value={description} onChange={(e) => setDescription(e.target.value)} />
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
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={!selectedPolicyId}>Next</Button>
            )}
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={!description || !amount}>
                Submit Claim Onchain
              </Button>
            )}
            {step === 3 && (
              <Button onClick={() => { setOpen(false); setStep(1); setSelectedPolicyId(null); }}>Done</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
