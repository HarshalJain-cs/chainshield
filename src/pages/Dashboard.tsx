import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ShieldCheck, Coins, FileWarning, Loader2, Plus } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { products, lineMeta, fmtUsd, type CoverageLine } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Window } from "@/components/Window";
import { useUserPolicies } from "@/hooks/useUserPolicies";
import { useUserClaims } from "@/hooks/useClaims";
import { useUserPositions } from "@/hooks/useUserPositions";
import { toast } from "@/hooks/use-toast";

// Coverage type → product ID mapping
const coverageTypeToProductId: Record<string, string> = {
  defi_smart_contract: "aave",
  defi_protocol_hack: "uniswap",
  defi_oracle_failure: "lido",
  health_basic: "health-basic",
  health_standard: "health-std",
  health_premium: "health-prem",
  life_term: "life-term-20",
  auto_liability: "auto-liability",
  auto_full: "auto-full",
  auto_ev: "auto-ev",
  finance_wallet: "fin-wallet",
  finance_cex: "fin-cex",
  travel_basic: "travel-basic",
  travel_medical: "travel-medical",
};

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

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { policies, isLoading: policiesLoading } = useUserPolicies();
  const { claims } = useUserClaims();
  const { positions } = useUserPositions();
  const seedDatabase = useMutation(api.seed.seedDatabase);

  if (!isConnected) {
    return (
      <div className="container py-24">
        <div className="max-w-xl mx-auto">
          <Window title="auth.required" tag="connect" tagColor="primary" large>
            <div className="p-12 text-center">
              <Wallet className="h-10 w-10 mx-auto mb-4" />
              <h1 className="font-display text-4xl mb-2">Connect your wallet</h1>
              <p className="text-foreground/70 mb-6">Sign in to view your active cover, claims and LP positions.</p>
              <div className="flex justify-center"><ConnectButton /></div>
            </div>
          </Window>
        </div>
      </div>
    );
  }

  const activePolicies = policies.filter((p) => p.status === "active");
  const portfolioCover = activePolicies.reduce((s, p) => s + p.coverageAmountUsd, 0);
  const lpValue = positions.reduce((s, p) => s + p.depositedAmountUsd, 0);
  const openClaims = claims.filter((c) =>
    ["Submitted", "Oracle check", "Manual review"].includes(c.status)
  ).length;

  // Group active policies by coverage line
  const lines = Array.from(
    new Set(activePolicies.map((p) => coverageTypeToLine[p.coverageType] ?? "defi"))
  ) as CoverageLine[];

  const handleSeed = async () => {
    try {
      await seedDatabase({ walletAddress: address });
      toast({ title: "✅ Demo data loaded", description: "Policies, claims and pools have been seeded." });
    } catch (e: any) {
      toast({ title: "Seed failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="container py-10 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip mb-2">Account</span>
          <h1 className="font-display text-5xl md:text-6xl">Dashboard.</h1>
          <p className="text-foreground/70 font-mono text-sm mt-2">{address?.slice(0, 6)}…{address?.slice(-4)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {policies.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>
              <Plus className="h-4 w-4 mr-1" /> Load Demo Data
            </Button>
          )}
          <Button asChild variant="outline"><Link to="/claims">File claim</Link></Button>
          <Button asChild><Link to="/cover">Buy cover</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={ShieldCheck} label="Active cover" value={fmtUsd(portfolioCover)} accent />
        <KPI icon={FileWarning} label="Open claims" value={String(openClaims)} />
        <KPI icon={Coins} label="LP value" value={fmtUsd(lpValue)} />
        <KPI icon={Wallet} label="Avg APY" value={positions.length ? `${(positions.reduce((s, p) => s + ((p.pool as any)?.apy ?? 0), 0) / positions.length).toFixed(1)}%` : "—"} />
      </div>

      {policiesLoading ? (
        <div className="flex items-center gap-2 text-foreground/50 py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading policies...
        </div>
      ) : activePolicies.length === 0 ? (
        <Window title="policies.empty" tag="empty" tagColor="muted">
          <div className="p-12 text-center">
            <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-foreground/30" />
            <p className="text-foreground/50">No active policies. Buy cover or load demo data above.</p>
          </div>
        </Window>
      ) : (
        lines.map((line) => {
          const linePolicies = activePolicies.filter(
            (p) => (coverageTypeToLine[p.coverageType] ?? "defi") === line
          );
          return (
            <section key={line}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-3xl">{lineMeta[line].label}</h2>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground"
                  style={{ background: `hsl(${lineMeta[line].color} / 0.4)` }}
                >
                  {linePolicies.length} polic{linePolicies.length === 1 ? "y" : "ies"}
                </span>
              </div>
              <Window title={`policies.${line}`} tag="table" tagColor="muted">
                <Table>
                  <TableHeader>
                    <TableRow className="border-foreground">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linePolicies.map((p) => {
                      const productId = p.productId ?? coverageTypeToProductId[p.coverageType];
                      const product = products.find((x) => x.id === productId) ?? products[0];
                      return (
                        <TableRow key={p._id} className="border-foreground/20">
                          <TableCell><span className="font-medium">{product.name}</span></TableCell>
                          <TableCell className="text-right font-mono">{fmtUsd(p.coverageAmountUsd)}</TableCell>
                          <TableCell className="text-right font-mono text-primary">${p.premiumAmountUsd}</TableCell>
                          <TableCell className="font-mono text-xs uppercase">{p.paymentFrequency}</TableCell>
                          <TableCell className="font-mono text-xs">{p.endDate}</TableCell>
                          <TableCell><StatusBadge status={p.status === "active" ? "Active" : p.status} /></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" asChild>
                              <Link to="/claims">Claim</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Window>
            </section>
          );
        })
      )}

      {/* LP Positions */}
      {positions.length > 0 && (
        <section>
          <h2 className="font-display text-3xl mb-4">LP positions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {positions.map((pos) => {
              const pool = pos.pool as any;
              return (
                <Window key={pos._id} title={pool?.poolId ?? "position"} tag={pool?.poolType ?? "DeFi"} tagColor="secondary" hover>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-display text-xl">{pool?.name ?? "Pool"}</div>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground bg-secondary">
                        {pool?.apy ?? 0}% APY
                      </span>
                    </div>
                    <div className="font-display text-3xl">${pos.depositedAmountUsd.toLocaleString()}</div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">
                      Your stake · {pos.depositedToken}
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                      <Link to="/stake">Manage</Link>
                    </Button>
                  </div>
                </Window>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <Window title={label.toLowerCase().replace(" ", "_")} tag="kpi" tagColor={accent ? "primary" : "muted"}>
      <div className="p-5">
        <Icon className={`h-4 w-4 mb-2 ${accent ? "text-primary" : ""}`} />
        <div className="font-display text-3xl">{value}</div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">{label}</div>
      </div>
    </Window>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-secondary text-foreground",
    active: "bg-secondary text-foreground",
    Expired: "bg-muted text-foreground",
    expired: "bg-muted text-foreground",
    Claimed: "bg-primary text-primary-foreground",
    claimed: "bg-primary text-primary-foreground",
    Submitted: "bg-[hsl(var(--warning))] text-foreground",
    "Oracle check": "bg-[hsl(var(--warning))] text-foreground",
    "Auto-approved": "bg-secondary text-foreground",
    "Manual review": "bg-[hsl(var(--warning))] text-foreground",
    Pending: "bg-[hsl(var(--warning))] text-foreground",
    Approved: "bg-secondary text-foreground",
    Rejected: "bg-destructive text-destructive-foreground",
    Paid: "bg-primary text-primary-foreground",
    Failed: "bg-destructive text-destructive-foreground",
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
