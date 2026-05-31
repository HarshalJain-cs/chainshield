import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface AuditLogProps {
  entries: Doc<"adminActions">[];
}

const ACTION_COLORS: Record<string, string> = {
  approve_claim: "text-green-500",
  reject_claim: "text-red-500",
  assign_reviewer: "text-blue-500",
  suspend_user: "text-amber-500",
  unsuspend_user: "text-cyan-500",
  update_pool: "text-purple-500",
};

const ACTION_LABELS: Record<string, string> = {
  approve_claim: "Approved claim",
  reject_claim: "Rejected claim",
  assign_reviewer: "Assigned reviewer",
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  update_pool: "Updated pool",
};

function fmtWallet(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLog({ entries }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <div className="window-lg bg-card py-10 text-center">
        <p className="text-xs font-mono text-muted-foreground">No audit events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="window-lg overflow-hidden">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b-[1.5px] border-foreground">
            {["Time", "Admin", "Action", "Target", "Details"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry._id}
              className="border-b-[1px] border-foreground/20 last:border-0 hover:bg-muted/20 transition-smooth"
            >
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                {fmtTime(entry.createdAt)}
              </td>
              <td className="px-3 py-2">
                <code className="text-[10px]">{fmtWallet(entry.adminWallet)}</code>
              </td>
              <td className="px-3 py-2">
                <span className={cn("font-semibold", ACTION_COLORS[entry.action] ?? "text-foreground")}>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {entry.targetType}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                {entry.details?.notes
                  ? `"${(entry.details.notes as string).slice(0, 50)}"`
                  : entry.details?.reason
                    ? `Reason: ${(entry.details.reason as string).slice(0, 40)}`
                    : "—"
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
