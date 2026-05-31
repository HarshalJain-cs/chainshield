import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AuditLog } from "@/components/admin/AuditLog";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminAudit() {
  const { auditLog, isLoading } = useAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/admin" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <span>Audit Log</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-mono tracking-tight">Audit Log</h1>
        <span className="text-xs font-mono text-muted-foreground">
          {auditLog.length} entries
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        Immutable record of all admin actions performed on the platform.
      </p>

      {isLoading ? (
        <div className="window-lg bg-card p-8 text-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <AuditLog entries={auditLog} />
      )}
    </div>
  );
}
