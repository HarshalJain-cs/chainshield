import { useEffect } from "react";
import { CheckCircle, Loader2, XCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TxStatus } from "@/lib/contracts/mockTx";
import { formatTxHash, getEtherscanUrl } from "@/lib/contracts/mockTx";

interface TxStatusModalProps {
  open: boolean;
  onClose: () => void;
  status: TxStatus;
  txHash?: string | null;
  title?: string;
  successMessage?: string;
  onSuccess?: () => void;
}

const statusConfig: Record<
  TxStatus,
  { icon: React.ReactNode; label: string; color: string }
> = {
  idle: {
    icon: <Loader2 className="h-8 w-8 animate-spin" />,
    label: "Preparing transaction...",
    color: "text-foreground/60",
  },
  pending: {
    icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
    label: "Waiting for wallet confirmation...",
    color: "text-primary",
  },
  confirming: {
    icon: <Loader2 className="h-8 w-8 animate-spin text-warning" />,
    label: "Transaction submitted. Waiting for block confirmation...",
    color: "text-warning",
  },
  success: {
    icon: <CheckCircle className="h-8 w-8 text-secondary" />,
    label: "Transaction confirmed!",
    color: "text-secondary",
  },
  error: {
    icon: <XCircle className="h-8 w-8 text-destructive" />,
    label: "Transaction failed",
    color: "text-destructive",
  },
};

export function TxStatusModal({
  open,
  onClose,
  status,
  txHash,
  title = "Transaction",
  successMessage = "Your transaction was successful.",
  onSuccess,
}: TxStatusModalProps) {
  const config = statusConfig[status] ?? statusConfig.idle;

  useEffect(() => {
    if (status === "success" && onSuccess) {
      const timer = setTimeout(onSuccess, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card max-w-sm border-[1.5px] border-foreground rounded-none">
        <div className="py-6 text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">{config.icon}</div>

          {/* Title */}
          <div>
            <div className="font-display text-2xl">{title}</div>
            <p className={`text-sm mt-1 ${config.color}`}>{config.label}</p>
          </div>

          {/* Success message */}
          {status === "success" && (
            <p className="text-sm text-foreground/70">{successMessage}</p>
          )}

          {/* Tx Hash */}
          {txHash && (
            <div className="bg-muted border-[1.5px] border-foreground px-3 py-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-foreground/70">
                {formatTxHash(txHash)}
              </span>
              <a
                href={getEtherscanUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:opacity-70 transition-opacity"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Progress bar */}
          {(status === "pending" || status === "confirming") && (
            <div className="h-1 bg-muted border-[1.5px] border-foreground overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: status === "pending" ? "33%" : "66%",
                }}
              />
            </div>
          )}

          {/* Close button */}
          {(status === "success" || status === "error") && (
            <Button onClick={onClose} className="w-full" variant={status === "error" ? "outline" : "default"}>
              {status === "error" ? "Try Again" : "Done"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
