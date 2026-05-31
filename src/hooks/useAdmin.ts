import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";

/**
 * Admin data hook — provides dashboard stats, claim management, user management.
 * Requires role === "admin" or "reviewer" to see meaningful data.
 */
export function useAdmin() {
  const { address, isAdmin, isReviewer } = useUser();

  // Only fetch if user has admin/reviewer access
  const shouldFetch = isAdmin || isReviewer;

  const dashboard = useQuery(
    api.admin.getAdminDashboard,
    shouldFetch ? {} : "skip"
  );

  const pendingClaims = useQuery(
    api.admin.getPendingClaims,
    shouldFetch ? {} : "skip"
  );

  const allUsers = useQuery(
    api.users.getAllUsers,
    isAdmin ? {} : "skip"
  );

  const auditLogQuery = useQuery(
    api.admin.getAuditLog,
    isAdmin ? { limit: 50 } : "skip"
  );

  // Mutations
  const assignReviewerMutation = useMutation(api.admin.assignReviewer);
  const reviewClaimMutation = useMutation(api.admin.reviewClaim);
  const suspendUserMutation = useMutation(api.admin.suspendUser);
  const setUserRoleMutation = useMutation(api.users.setUserRole);

  const assignReviewer = async (claimId: string, reviewerWallet: string) => {
    if (!address) throw new Error("Not authenticated");
    await assignReviewerMutation({
      claimId: claimId as any,
      reviewerWallet,
      adminWallet: address,
    });
  };

  const reviewClaim = async (params: {
    claimId: string;
    decision: "approve" | "reject";
    approvedAmountUsd?: number;
    notes: string;
  }) => {
    if (!address) throw new Error("Not authenticated");
    await reviewClaimMutation({
      claimId: params.claimId as any,
      decision: params.decision,
      approvedAmountUsd: params.approvedAmountUsd,
      notes: params.notes,
      adminWallet: address,
    });
  };

  const suspendUser = async (targetWallet: string, isSuspended: boolean, reason?: string) => {
    if (!address) throw new Error("Not authenticated");
    await suspendUserMutation({
      targetWallet,
      isSuspended,
      adminWallet: address,
      reason,
    });
  };

  const setUserRole = async (targetWallet: string, role: "policyholder" | "liquidity_provider" | "admin" | "reviewer") => {
    await setUserRoleMutation({ targetWallet, role });
  };

  return {
    dashboard,
    pendingClaims: pendingClaims ?? [],
    allUsers: allUsers ?? [],
    auditLog: auditLogQuery ?? [],
    isLoading: shouldFetch && dashboard === undefined,
    assignReviewer,
    reviewClaim,
    suspendUser,
    setUserRole,
  };
}
