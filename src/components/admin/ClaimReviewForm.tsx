import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ClaimReviewFormProps {
  claim: Doc<"claims">;
  onComplete?: () => void;
}

export function ClaimReviewForm({ claim, onComplete }: ClaimReviewFormProps) {
  const { reviewClaim } = useAdmin();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState(claim.requestedAmountUsd.toString());
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!notes.trim()) {
      toast({ title: "Notes required", description: "Please add reviewer notes before deciding.", variant: "destructive" });
      return;
    }
    if (decision === "reject" && notes.trim().length < 20) {
      toast({ title: "Insufficient reason", description: "Rejection reason must be at least 20 characters.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await reviewClaim({
        claimId: claim._id,
        decision,
        approvedAmountUsd: decision === "approve" ? Number(approvedAmount) : undefined,
        notes: notes.trim(),
      });
      toast({
        title: decision === "approve" ? "Claim approved" : "Claim rejected",
        description: decision === "approve"
          ? `$${Number(approvedAmount).toLocaleString()} payout approved.`
          : "Claimant has been notified with your reason.",
      });
      onComplete?.();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = claim.status === "Submitted" || claim.status === "Manual review" || claim.status === "Oracle check";

  if (!canReview) {
    return (
      <div className="window-lg bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          This claim has already been{" "}
          <span className="font-bold text-foreground">{claim.status.toLowerCase()}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="window-lg bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="font-mono font-bold text-sm uppercase tracking-wider">Review Decision</h3>
      </div>

      {/* Oracle verdict */}
      {claim.oracleVerdict && claim.oracleVerdict !== "n/a" && (
        <div className={`flex items-center gap-2 px-3 py-2 border-[1.5px] ${
          claim.oracleVerdict === "pass"
            ? "border-green-500 bg-green-500/10 text-green-500"
            : "border-red-500 bg-red-500/10 text-red-500"
        }`}>
          {claim.oracleVerdict === "pass" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-xs font-mono font-bold">
            Oracle verdict: {claim.oracleVerdict.toUpperCase()}
          </span>
        </div>
      )}

      {/* Claim summary */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Requested</p>
          <p className="font-bold text-lg">${claim.requestedAmountUsd.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Type</p>
          <p className="font-bold">{claim.incidentType}</p>
        </div>
      </div>

      {/* Approved amount (only for approvals) */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-mono uppercase tracking-wider">
          Approved Amount (USD)
        </Label>
        <Input
          type="number"
          value={approvedAmount}
          onChange={(e) => setApprovedAmount(e.target.value)}
          min={0}
          max={claim.requestedAmountUsd}
          className="font-mono text-sm"
          placeholder="0"
        />
        <p className="text-[10px] text-muted-foreground font-mono">
          Requested: ${claim.requestedAmountUsd.toLocaleString()}
        </p>
      </div>

      {/* Reviewer notes */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-mono uppercase tracking-wider">
          Reviewer Notes <span className="text-red-500">*</span>
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Provide detailed notes for your decision. These will be visible to the claimant."
          rows={4}
          className="font-mono text-sm resize-none"
        />
        <p className="text-[10px] text-muted-foreground font-mono text-right">
          {notes.length} chars {notes.length < 20 && "(min 20 for rejection)"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          id="btn-approve-claim"
          variant="default"
          disabled={submitting}
          onClick={() => handleDecision("approve")}
          className="flex-1 font-mono font-bold uppercase text-xs gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {submitting ? "Processing..." : "Approve Claim"}
        </Button>
        <Button
          id="btn-reject-claim"
          variant="outline"
          disabled={submitting}
          onClick={() => handleDecision("reject")}
          className="flex-1 font-mono font-bold uppercase text-xs gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
        >
          <XCircle className="h-4 w-4" />
          {submitting ? "Processing..." : "Reject Claim"}
        </Button>
      </div>
    </div>
  );
}
