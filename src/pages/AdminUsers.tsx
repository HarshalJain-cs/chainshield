import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminUsers() {
  const { allUsers, isLoading } = useAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/admin" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <span>Users</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-mono tracking-tight">User Management</h1>
        <span className="text-xs font-mono text-muted-foreground">
          {allUsers.length} total users
        </span>
      </div>

      {isLoading ? (
        <div className="window-lg bg-card p-8 text-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <UserTable users={allUsers} />
      )}
    </div>
  );
}
