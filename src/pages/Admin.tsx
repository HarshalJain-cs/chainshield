import { Link } from "react-router-dom";
import { Clock, ChevronRight, Users, Shield, Activity } from "lucide-react";
import { StatsCards } from "@/components/admin/StatsCards";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  "Submitted": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "Oracle check": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "Manual review": "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function timeAgo(ts: number) {
  const h = Math.floor((Date.now() - ts) / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Admin() {
  const { dashboard, pendingClaims, isLoading } = useAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-mono tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground font-mono">
          Platform overview · ChainShield Operations
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={dashboard} />

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/admin/claims", label: "Claims Queue", icon: Clock, count: dashboard?.pendingClaimsCount },
          { to: "/admin/users", label: "User Mgmt", icon: Users, count: dashboard?.totalUsers },
          { to: "/admin/audit", label: "Audit Log", icon: Activity },
        ].map(({ to, label, icon: Icon, count }) => (
          <Link
            key={to}
            to={to}
            className="window-lg bg-card p-4 flex items-center justify-between hover:bg-muted/30 transition-smooth group"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-smooth" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {count !== undefined && (
                <span className="text-xs font-mono text-muted-foreground">{count}</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
        ))}

        {/* Mode badge */}
        <div className="window-lg bg-card p-4 flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Mode</p>
            <p className="text-xs font-mono font-bold">
              {import.meta.env.VITE_MODE === "live" ? "🟢 LIVE" : "🟡 DEMO"}
            </p>
          </div>
        </div>
      </div>

      {/* Pending claims */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider">Pending Claims</h2>
          <Link
            to="/admin/claims"
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="window-lg overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-foreground/20">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
                  <div className="h-3 bg-muted rounded w-48 mb-2" />
                  <div className="h-2 bg-muted/60 rounded w-32" />
                </div>
              ))}
            </div>
          ) : pendingClaims.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-muted-foreground">
              No pending claims — great work! ✓
            </div>
          ) : (
            <div className="divide-y divide-foreground/10">
              {pendingClaims.slice(0, 5).map((claim) => (
                <Link
                  key={claim._id}
                  to={`/admin/claims/${claim._id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-smooth group"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-mono font-bold">
                        {claim.incidentType}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {claim.claimant.slice(0, 6)}...{claim.claimant.slice(-4)} · {timeAgo(claim.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold">
                      {fmtUsd(claim.requestedAmountUsd)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 border",
                      STATUS_STYLES[claim.status] ?? "text-muted-foreground border-foreground/20"
                    )}>
                      {claim.status}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
