import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ShieldCheck, Coins, FileWarning } from "lucide-react";
import { policies, claims, pools, protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="container py-24">
        <div className="glass rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Wallet className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-2">Connect your wallet</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your active cover, claims and LP positions.</p>
          <div className="flex justify-center"><ConnectButton /></div>
        </div>
      </div>
    );
  }

  const myPolicies = policies;
  const myPools = pools.filter((p) => p.myStakeUsd);
  const portfolioCover = myPolicies.filter((p) => p.status === "Active").reduce((s, p) => s + p.amountUsd, 0);
  const lpValue = myPools.reduce((s, p) => s + (p.myStakeUsd || 0), 0);

  return (
    <div className="container py-12 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{address?.slice(0, 6)}…{address?.slice(-4)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/claims">File claim</Link></Button>
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/cover">Buy cover</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={ShieldCheck} label="Active cover" value={fmtUsd(portfolioCover)} accent />
        <KPI icon={FileWarning} label="Open claims" value={String(claims.filter((c) => c.status === "Voting").length)} />
        <KPI icon={Coins} label="LP value" value={fmtUsd(lpValue)} />
        <KPI icon={Wallet} label="Avg APY" value="9.6%" />
      </div>

      <section>
        <h2 className="font-display text-2xl font-bold mb-4">Active policies</h2>
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPolicies.map((p) => {
                const proto = protocols.find((x) => x.id === p.protocolId)!;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell><span className="font-medium">{proto.name}</span></TableCell>
                    <TableCell className="text-right font-mono">{fmtUsd(p.amountUsd)}</TableCell>
                    <TableCell className="text-right font-mono text-primary">${p.premiumUsd}</TableCell>
                    <TableCell className="font-mono text-xs">{p.endDate}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Renew</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold mb-4">LP positions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myPools.map((pool) => {
            const proto = protocols.find((x) => x.id === pool.protocolId)!;
            return (
              <div key={pool.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display font-semibold">{proto.name}</div>
                  <span className="font-mono text-primary text-sm">{pool.apy}% APY</span>
                </div>
                <div className="text-2xl font-mono font-bold">${pool.myStakeUsd?.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Your stake</div>
                <Button size="sm" variant="outline" className="mt-4 w-full">Manage</Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className={`h-4 w-4 mb-2 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success border-success/30",
    Expired: "bg-muted text-muted-foreground border-border",
    Claimed: "bg-primary/15 text-primary border-primary/30",
    Voting: "bg-warning/15 text-warning border-warning/30",
    Pending: "bg-warning/15 text-warning border-warning/30",
    Approved: "bg-success/15 text-success border-success/30",
    Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${map[status] || ""}`}>{status}</span>;
}