import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface AdminGuardProps {
  children: ReactNode;
  /** Minimum role required. "reviewer" allows admin + reviewer. "admin" allows only admin. */
  requiredRole?: "admin" | "reviewer";
}

/**
 * Route guard that restricts access to admin and reviewer users.
 * Redirects unauthorized users to /app with no flash.
 */
export function AdminGuard({ children, requiredRole = "reviewer" }: AdminGuardProps) {
  const { isConnected, isAdmin, isReviewer, isLoading } = useUser();

  // While loading user data, render nothing (avoid flash of redirect)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not connected at all
  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  // Check role
  const hasAccess =
    requiredRole === "admin" ? isAdmin : isReviewer;

  if (!hasAccess) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
