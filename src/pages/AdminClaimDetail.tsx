import { Link, useParams } from "react-router-dom";
import { ChevronRight, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClaimReviewForm } from "@/components/admin/ClaimReviewForm";
import { EvidenceGallery } from "@/components/admin/EvidenceGallery";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

const STATUS_STYLES: Record<string, string> = {
  "Submitted": "text-blue-400 border-blue-500/30 bg-blue-500/10",
  "Oracle check": "text-purple-400 border-purple-500/30 bg-purple-500/10",
  "Manual review": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "Auto-approved": "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  "Approved": "text-green-400 border-green-500/30 bg-green-500/10",
  "Rejected": "text-red-400 border-red-500/30 bg-red-500/10",
  "Paid": "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2 border-b-[1px] border-foreground/10 last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs font-mono flex-1">{value}</span>
    </div>
  );
}

export default function AdminClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const { address } = useUser();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const claim = useQuery(api.claims.getClaimById, id ? { id: id as Id<"claims"> } : "skip");
  const messages = useQuery(api.claims.getClaimMessages, id ? { claimId: id as Id<"claims"> } : "skip");
  const addMessageMutation = useMutation(api.claims.addClaimMessage);

  const sendMessage = async () => {
    if (!newMessage.trim() || !address || !id) return;
    setSending(true);
    try {
      await addMessageMutation({
        claimId: id as Id<"claims">,
        senderWallet: address,
        senderRole: "reviewer",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (claim === undefined) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="font-mono text-muted-foreground">Claim not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/admin" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/admin/claims" className="hover:text-foreground">Claims</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{id?.slice(0, 8)}...</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight">{claim.incidentType}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {claim.claimant.slice(0, 10)}...{claim.claimant.slice(-6)}
            {" · "}
            {new Date(claim.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={cn(
          "text-xs font-mono uppercase tracking-wider border px-3 py-1",
          STATUS_STYLES[claim.status] ?? "text-muted-foreground border-foreground/20"
        )}>
          {claim.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Claim details + evidence + messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim details */}
          <div className="window-lg bg-card p-5 space-y-0">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Claim Details
            </h3>
            <DetailRow label="Claim Type" value={claim.claimType} />
            <DetailRow label="Incident Type" value={claim.incidentType} />
            <DetailRow label="Incident Date" value={claim.incidentDate} />
            <DetailRow label="Requested" value={`$${claim.requestedAmountUsd.toLocaleString()}`} />
            {claim.approvedAmountUsd && (
              <DetailRow label="Approved" value={`$${claim.approvedAmountUsd.toLocaleString()}`} />
            )}
            <DetailRow label="Description" value={
              <span className="whitespace-pre-wrap">{claim.description}</span>
            } />
            {/* DeFi specific */}
            <DetailRow label="Protocol" value={claim.protocolName} />
            <DetailRow label="Incident TX" value={claim.incidentTxHash ? (
              <code className="text-[10px]">{claim.incidentTxHash}</code>
            ) : undefined} />
            <DetailRow label="Contract" value={claim.affectedContract ? (
              <code className="text-[10px]">{claim.affectedContract}</code>
            ) : undefined} />
            {/* Health specific */}
            <DetailRow label="Provider" value={claim.providerName} />
            <DetailRow label="Treatment" value={claim.treatmentFrom && claim.treatmentTo
              ? `${claim.treatmentFrom} → ${claim.treatmentTo}` : undefined} />
            {/* Review */}
            {claim.reviewerNotes && (
              <DetailRow label="Reviewer Notes" value={
                <span className="italic">{claim.reviewerNotes}</span>
              } />
            )}
            {claim.assignedReviewer && (
              <DetailRow label="Assigned To" value={
                <code className="text-[10px]">{claim.assignedReviewer.slice(0,10)}...</code>
              } />
            )}
          </div>

          {/* Evidence */}
          <EvidenceGallery cids={claim.evidenceCids} />

          {/* Messages thread */}
          <div className="window-lg bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b-[1.5px] border-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Communication Thread
              </h3>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-foreground/10 p-0">
              {!messages || messages.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground p-4">No messages yet.</p>
              ) : messages.map((msg) => (
                <div key={msg._id} className={cn(
                  "px-4 py-3",
                  msg.senderRole === "reviewer" ? "bg-primary/5" : ""
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-mono uppercase tracking-wide",
                      msg.senderRole === "reviewer" ? "text-primary" :
                      msg.senderRole === "system" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {msg.senderRole === "system" ? "System" :
                       `${msg.senderWallet.slice(0, 6)}...`}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-mono">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Send message */}
            <div className="flex border-t-[1.5px] border-foreground">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Send message to claimant..."
                className="flex-1 bg-transparent px-4 py-2.5 text-xs font-mono focus:outline-none placeholder:text-muted-foreground/50"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="px-4 border-l-[1.5px] border-foreground hover:bg-primary hover:text-primary-foreground transition-smooth disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Review form */}
        <div className="space-y-4">
          <ClaimReviewForm
            claim={claim}
            onComplete={() => {
              toast({ title: "Review submitted" });
            }}
          />
        </div>
      </div>
    </div>
  );
}
