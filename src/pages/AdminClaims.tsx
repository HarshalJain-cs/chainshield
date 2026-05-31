import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Filter } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "Submitted" | "Oracle check" | "Manual review" | "Approved" | "Rejected" | "Paid";

const STATUS_STYLES: Record<string, string> = {
  "Submitted": "text-blue-400 border-blue-500/50",
  "Oracle check": "text-purple-400 border-purple-500/50",
  "Manual review": "text-amber-400 border-amber-500/50",
  "Auto-approved": "text-cyan-400 border-cyan-500/50",
  "Approved": "text-green-400 border-green-500/50",
  "Rejected": "text-red-400 border-red-500/50",
  "Paid": "text-emerald-400 border-emerald-500/50",
};

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

function timeAgo(ts: number) {
  const h = Math.floor((Date.now() - ts) / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminClaims() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const allClaims = useQuery(api.admin.getAllClaimsAdmin, { status: filter === "all" ? undefined : filter });
  const { isLoading } = useAdmin();

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Submitted", value: "Submitted" },
    { label: "Oracle check", value: "Oracle check" },
    { label: "Manual review", value: "Manual review" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Paid", value: "Paid" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Claims</span>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tight">Claims Queue</h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          {allClaims?.length ?? 0} claims
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto gap-0 window-lg">
        {filters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-4 py-2 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-r-[1.5px] border-foreground last:border-r-0",
              "hover:bg-muted/40 transition-smooth",
              filter === value && "bg-primary text-primary-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Claims table */}
      <div className="window-lg overflow-hidden">
        {!allClaims ? (
          <div className="divide-y divide-foreground/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse flex gap-4">
                <div className="h-3 bg-muted rounded w-48" />
                <div className="h-3 bg-muted/60 rounded w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : allClaims.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted-foreground">
            No claims with status: {filter}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-6 px-4 py-2 border-b-[1.5px] border-foreground bg-muted/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="col-span-2">Claimant / Type</span>
              <span>Amount</span>
              <span>Oracle</span>
              <span>Status</span>
              <span>Submitted</span>
            </div>

            {allClaims.map((claim) => (
              <Link
                key={claim._id}
                to={`/admin/claims/${claim._id}`}
                className="grid grid-cols-6 items-center px-4 py-3.5 border-b-[1px] border-foreground/20 last:border-0 hover:bg-muted/30 transition-smooth group"
              >
                <div className="col-span-2">
                  <p className="text-xs font-mono font-bold">{claim.incidentType}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {claim.claimant.slice(0, 6)}...{claim.claimant.slice(-4)}
                    {claim.assignedReviewer && (
                      <span className="ml-2 text-blue-400">• assigned</span>
                    )}
                  </p>
                </div>

                <span className="text-sm font-mono font-bold">
                  {fmtUsd(claim.requestedAmountUsd)}
                </span>

                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wide",
                  claim.oracleVerdict === "pass" ? "text-green-500" :
                  claim.oracleVerdict === "fail" ? "text-red-500" : "text-muted-foreground"
                )}>
                  {claim.oracleVerdict ?? "n/a"}
                </span>

                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wide border px-1.5 py-0.5 w-fit",
                  STATUS_STYLES[claim.status] ?? "text-muted-foreground border-foreground/20"
                )}>
                  {claim.status}
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {timeAgo(claim.createdAt)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
