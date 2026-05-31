import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number; // positive = up, negative = down
  icon?: LucideIcon;
  accentColor?: string;
}

function StatCard({ label, value, subValue, trend, icon: Icon, accentColor }: StatCardProps) {
  return (
    <div className="window-lg bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className={cn("p-1.5 border-[1.5px] border-foreground", accentColor)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{subValue}</p>
        )}
      </div>

      {trend !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-mono",
          trend >= 0 ? "text-green-500" : "text-red-500"
        )}>
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      )}
    </div>
  );
}

interface StatsCardsProps {
  stats: {
    totalPolicies: number;
    activePolicies: number;
    totalClaims: number;
    pendingClaimsCount: number;
    totalTvlUsd: number;
    totalCoverageUsd: number;
    totalRevenue: number;
    revenue30d: number;
    totalUsers: number;
    suspendedUsers: number;
  } | null | undefined;
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="window-lg bg-card p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Policies"
        value={stats.totalPolicies.toLocaleString()}
        subValue={`${stats.activePolicies} active`}
        trend={4.2}
      />
      <StatCard
        label="Pending Claims"
        value={stats.pendingClaimsCount.toLocaleString()}
        subValue={`${stats.totalClaims} total claims`}
        trend={-2.1}
      />
      <StatCard
        label="Total TVL"
        value={fmtUsd(stats.totalTvlUsd)}
        subValue={`${fmtUsd(stats.totalCoverageUsd)} covered`}
        trend={8.7}
      />
      <StatCard
        label="Revenue (30d)"
        value={fmtUsd(stats.revenue30d)}
        subValue={`${fmtUsd(stats.totalRevenue)} total`}
        trend={12.3}
      />
      <StatCard
        label="Total Users"
        value={stats.totalUsers.toLocaleString()}
        subValue={`${stats.suspendedUsers} suspended`}
      />
      <StatCard
        label="Claims Rate"
        value={`${stats.totalPolicies > 0 ? ((stats.totalClaims / stats.totalPolicies) * 100).toFixed(1) : 0}%`}
        subValue="claims per policy"
      />
      <StatCard
        label="Avg Coverage"
        value={fmtUsd(stats.activePolicies > 0 ? stats.totalCoverageUsd / stats.activePolicies : 0)}
        subValue="per active policy"
      />
      <StatCard
        label="Pool Utilization"
        value={`${stats.totalCoverageUsd > 0 && stats.totalTvlUsd > 0
          ? Math.min(100, (stats.totalCoverageUsd / stats.totalTvlUsd * 100)).toFixed(0)
          : 0}%`}
        subValue="coverage / TVL ratio"
      />
    </div>
  );
}
