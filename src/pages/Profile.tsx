import { useState } from "react";
import { Wallet, Shield, Edit2, CheckCircle, Clock, FileText } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useAppMode } from "@/hooks/useAppMode";
import { cn } from "@/lib/utils";

const KYC_STYLES: Record<string, string> = {
  none: "text-muted-foreground border-foreground/30",
  pending: "text-amber-400 border-amber-500/50 bg-amber-500/10",
  approved: "text-green-400 border-green-500/50 bg-green-500/10",
  rejected: "text-red-400 border-red-500/50 bg-red-500/10",
};

const ROLE_LABELS: Record<string, string> = {
  policyholder: "Policyholder",
  liquidity_provider: "Liquidity Provider",
  admin: "Administrator",
  reviewer: "Claim Reviewer",
};

export default function Profile() {
  const { user, address, isConnected, isAdmin } = useUser();
  const { toast } = useToast();
  const { mode } = useAppMode();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);

  const updateProfileMutation = useMutation(api.users.updateProfile);

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    try {
      await updateProfileMutation({ walletAddress: address, displayName: displayName || undefined });
      setEditing(false);
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <Wallet className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="text-lg font-bold font-mono">Connect your wallet</h1>
        <p className="text-sm text-muted-foreground font-mono">
          Connect via the top-right button to view your profile.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <h1 className="text-xl font-bold font-mono tracking-tight">My Profile</h1>

      {/* Identity card */}
      <div className="window-lg bg-card p-6 space-y-5">
        {/* Avatar + wallet */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 border-[1.5px] border-foreground bg-primary/10 flex items-center justify-center text-xl font-bold font-mono">
            {user.displayName?.charAt(0).toUpperCase() ?? address?.slice(2, 4).toUpperCase()}
          </div>
          <div>
            {editing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="border-[1.5px] border-primary bg-transparent px-2 py-1 text-sm font-mono focus:outline-none"
                autoFocus
              />
            ) : (
              <p className="font-bold font-mono text-base">
                {user.displayName ?? <span className="text-muted-foreground italic">No display name</span>}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              <code>{address}</code>
            </p>
          </div>
          <button
            onClick={() => {
              if (editing) handleSave();
              else { setDisplayName(user.displayName ?? ""); setEditing(true); }
            }}
            disabled={saving}
            className="ml-auto text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {editing ? (
              saving ? "Saving..." : <><CheckCircle className="h-3.5 w-3.5" /> Save</>
            ) : (
              <><Edit2 className="h-3.5 w-3.5" /> Edit</>
            )}
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t-[1px] border-foreground/20">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Role</p>
            <p className="text-sm font-mono font-semibold mt-0.5">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">KYC Status</p>
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wide border px-1.5 py-0.5 mt-0.5",
              KYC_STYLES[user.kycStatus]
            )}>
              {user.kycStatus === "approved" && <CheckCircle className="h-3 w-3" />}
              {user.kycStatus}
            </span>
          </div>
          {user.email && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-mono mt-0.5">{user.email}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Member Since</p>
            <p className="text-sm font-mono mt-0.5">
              {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          {user.lastLoginAt && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Last Login</p>
              <p className="text-sm font-mono mt-0.5">
                {new Date(user.lastLoginAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">App Mode</p>
            <p className="text-sm font-mono mt-0.5 font-bold">
              {mode === "live" ? "🟢 Live (Sepolia)" : "🟡 Demo"}
            </p>
          </div>
        </div>
      </div>

      {/* Coverage stats */}
      <div className="window-lg bg-card p-5">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Coverage Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">
              ${user.totalCoverageUsd.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
              Total Coverage
            </p>
          </div>
          <div className="text-center border-x-[1px] border-foreground/20">
            <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">—</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
              Active Policies
            </p>
          </div>
          <div className="text-center">
            <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">—</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
              Claims Filed
            </p>
          </div>
        </div>
      </div>

      {/* Admin notice */}
      {isAdmin && (
        <div className="window-lg border-primary bg-primary/5 p-4 flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs font-mono font-bold">Administrator Account</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              You have elevated privileges. Access the admin dashboard at{" "}
              <a href="/admin" className="text-primary hover:underline">/admin</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
