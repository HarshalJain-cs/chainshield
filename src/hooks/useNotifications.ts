import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";

/**
 * Real-time notification subscription for the connected wallet.
 * Updates live via Convex subscriptions.
 */
export function useNotifications() {
  const { address, isConnected } = useUser();

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    address ? { walletAddress: address } : "skip"
  );

  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllNotificationsRead);

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    await markReadMutation({ id: notificationId as any });
  };

  const markAllRead = async () => {
    if (!address) return;
    await markAllReadMutation({ walletAddress: address });
  };

  return {
    notifications: notifications ?? [],
    unreadCount,
    isLoading: isConnected && notifications === undefined,
    markAsRead,
    markAllRead,
  };
}
