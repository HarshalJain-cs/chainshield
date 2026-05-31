import { useState } from "react";
import { ShieldCheck, ShieldOff, BadgeCheck, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface UserTableProps {
  users: Doc<"users">[];
}

type SortField = "walletAddress" | "role" | "createdAt" | "totalCoverageUsd";
type SortDir = "asc" | "desc";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-500 border-red-500/30",
  reviewer: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  liquidity_provider: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  policyholder: "bg-muted text-muted-foreground border-foreground/20",
};

function fmtWallet(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export function UserTable({ users }: UserTableProps) {
  const { suspendUser, setUserRole } = useAdmin();
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = users
    .filter((u) =>
      !search || u.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let va: any = a[sortField as keyof typeof a];
      let vb: any = b[sortField as keyof typeof b];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleSuspend = async (user: Doc<"users">) => {
    setActioning(user._id);
    try {
      await suspendUser(user.walletAddress, !user.isSuspended);
      toast({ title: user.isSuspended ? "User unsuspended" : "User suspended" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setActioning(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by wallet or name..."
        className="w-full border-[1.5px] border-foreground bg-card px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
      />

      {/* Table */}
      <div className="window-lg overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b-[1.5px] border-foreground">
              {[
                { label: "Wallet", field: "walletAddress" as SortField },
                { label: "Name", field: null },
                { label: "Role", field: "role" as SortField },
                { label: "Coverage", field: "totalCoverageUsd" as SortField },
                { label: "Joined", field: "createdAt" as SortField },
                { label: "Status", field: null },
                { label: "Actions", field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  onClick={() => field && handleSort(field)}
                  className={cn(
                    "px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground",
                    field && "cursor-pointer hover:text-foreground select-none"
                  )}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {field && <SortIcon field={field} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user._id}
                className="border-b-[1px] border-foreground/20 last:border-0 hover:bg-muted/30 transition-smooth"
              >
                <td className="px-3 py-3">
                  <code className="text-[10px]">{fmtWallet(user.walletAddress)}</code>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {user.displayName ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <span className={cn(
                    "px-1.5 py-0.5 border text-[10px] uppercase tracking-wide",
                    ROLE_COLORS[user.role]
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-3 py-3">
                  ${user.totalCoverageUsd.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {fmtDate(user.createdAt)}
                </td>
                <td className="px-3 py-3">
                  {user.isSuspended ? (
                    <span className="text-red-500 uppercase text-[10px] tracking-wide">Suspended</span>
                  ) : (
                    <span className="text-green-500 uppercase text-[10px] tracking-wide">Active</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actioning === user._id}
                    onClick={() => handleSuspend(user)}
                    className={cn(
                      "h-6 text-[10px] font-mono px-2",
                      user.isSuspended
                        ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    )}
                  >
                    {user.isSuspended ? (
                      <><ShieldCheck className="h-3 w-3 mr-1" />Restore</>
                    ) : (
                      <><ShieldOff className="h-3 w-3 mr-1" />Suspend</>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs font-mono text-muted-foreground">
            {search ? "No users match your search" : "No users found"}
          </div>
        )}
      </div>

      <p className="text-[10px] font-mono text-muted-foreground">
        {filtered.length} of {users.length} users
      </p>
    </div>
  );
}
