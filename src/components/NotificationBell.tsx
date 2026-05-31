import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    claim_update: "🔔",
    policy_expiring: "⏰",
    policy_expired: "📋",
    yield_earned: "💰",
    governance: "🏛️",
  };
  return icons[type] ?? "📢";
}

export function NotificationBell() {
  const { isConnected } = useUser();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!isConnected) return null;

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${unreadCount} unread notifications`}
        className={cn(
          "relative h-full px-3 flex items-center justify-center",
          "border-l-[1.5px] border-foreground",
          "hover:bg-primary hover:text-primary-foreground transition-smooth"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 window-lg bg-card z-50 overflow-hidden shadow-window-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-foreground">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] rounded">
                  {unreadCount} new
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                No notifications yet
              </div>
            ) : (
              recent.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    markAsRead(n._id);
                    if (n.actionUrl) {
                      navigate(n.actionUrl);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex gap-3 px-4 py-3 border-b-[1px] border-foreground/20 last:border-0",
                    "cursor-pointer hover:bg-muted/40 transition-smooth",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  {/* Icon */}
                  <span className="text-base shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-xs font-mono truncate",
                        !n.isRead ? "font-bold" : "font-medium"
                      )}>
                        {n.title}
                      </p>
                      {n.actionUrl && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="h-1.5 w-1.5 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 8 && (
            <div className="px-4 py-2 border-t-[1.5px] border-foreground text-center">
              <span className="text-[10px] font-mono text-muted-foreground">
                {notifications.length - 8} older notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
