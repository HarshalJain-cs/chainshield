import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ShieldCheck, Coins, FileWarning } from "lucide-react";
import { policies, claims, pools, protocols, fmtUsd } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Window } from "@/components/Window";

export default function Dashboard() {
  const { isConnected, address } = useAccount();

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

  const myPolicies = policies;
  const myPools = pools.filter((p) => p.myStakeUsd);
  const portfolioCover = myPolicies.filter((p) => p.status === "Active").reduce((s, p) => s + p.amountUsd, 0);
  const lpValue = myPools.reduce((s, p) => s + (p.myStakeUsd || 0), 0);

  return (
    <div className="container py-10 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip mb-2">Account</span>
          <h1 className="font-display text-5xl md:text-6xl">Dashboard.</h1>
          <p className="text-foreground/70 font-mono text-sm mt-2">{address?.slice(0, 6)}…{address?.slice(-4)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/claims">File claim</Link></Button>
          <Button asChild><Link to="/cover">Buy cover</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={ShieldCheck} label="Active cover" value={fmtUsd(portfolioCover)} accent />
        <KPI icon={FileWarning} label="Open claims" value={String(claims.filter((c) => c.status === "Voting").length)} />
        <KPI icon={Coins} label="LP value" value={fmtUsd(lpValue)} />
        <KPI icon={Wallet} label="Avg APY" value="9.6%" />
      </div>

      <section>
        <h2 className="font-display text-3xl mb-4">Active policies</h2>
        <Window title="policies.table" tag="table" tagColor="muted">
          <Table>
            <TableHeader>
              <TableRow className="border-foreground">
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
                  <TableRow key={p.id} className="border-foreground/20">
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
        </Window>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-4">LP positions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myPools.map((pool) => {
            const proto = protocols.find((x) => x.id === pool.protocolId)!;
            return (
              <Window key={pool.id} title={pool.id} tag="pool" tagColor="secondary" hover>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-display text-xl">{proto.name}</div>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground bg-secondary">{pool.apy}% APY</span>
                  </div>
                  <div className="font-display text-3xl">${pool.myStakeUsd?.toLocaleString()}</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">Your stake</div>
                  <Button size="sm" variant="outline" className="mt-4 w-full">Manage</Button>
                </div>
              </Window>
            );
          })}
        </div>
      </section>
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
    Expired: "bg-muted text-foreground",
    Claimed: "bg-primary text-primary-foreground",
    Voting: "bg-[hsl(var(--warning))] text-foreground",
    Pending: "bg-[hsl(var(--warning))] text-foreground",
    Approved: "bg-secondary text-foreground",
    Rejected: "bg-destructive text-destructive-foreground",
  };
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border-[1.5px] border-foreground ${map[status] || ""}`}>{status}</span>;
}