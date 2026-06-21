import { useEffect, useRef, useState } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useConnect,
  useDisconnect,
} from "thirdweb/react";
import {
  createDemoWallet,
  clearDemoWallet,
  markDemoConnected,
  forgetDemoConnection,
  wasDemoConnected,
} from "@/lib/demoWallet";
import { client } from "@/lib/thirdweb";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

/**
 * No-signup connect button used when no thirdweb client ID is configured.
 * "Continue with Google" instantly creates a local demo wallet and registers
 * it with the thirdweb connection manager, so the whole app behaves exactly as
 * it would with a real connected wallet.
 */
export function DemoConnectButton() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  const connectWallet = () =>
    connect(async () => {
      const w = createDemoWallet();
      await w.connect({ client });
      return w;
    });

  // Auto-reconnect on refresh if the user was previously connected.
  const triedAutoConnect = useRef(false);
  useEffect(() => {
    if (triedAutoConnect.current || account) return;
    triedAutoConnect.current = true;
    if (wasDemoConnected()) {
      connectWallet().catch(() => forgetDemoConnection());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (account) {
    const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;
    return (
      <button
        onClick={() => {
          if (wallet) disconnect(wallet);
          forgetDemoConnection();
          setOpen(false);
          toast.info("Disconnected demo wallet");
        }}
        className="flex items-center gap-2 !bg-card !border-[1.5px] !border-foreground !px-3 !py-1.5 !text-xs !font-mono hover:!bg-muted transition-smooth"
        title="Disconnect"
      >
        <span className="h-2 w-2 bg-secondary" aria-hidden />
        {short}
        <LogOut className="h-3.5 w-3.5" />
      </button>
    );
  }

  const handleConnect = async () => {
    try {
      await connectWallet();
      markDemoConnected();
      toast.success("Demo wallet created", {
        description: "A local account was created for you. No signup needed.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create demo wallet";
      // A corrupted persisted key is the only realistic failure — reset and retry once.
      clearDemoWallet();
      toast.error("Could not create demo wallet", { description: message });
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isConnecting}
        className="!bg-primary !text-primary-foreground !border-[1.5px] !border-foreground !px-4 !py-2 !text-xs !font-mono !font-bold !uppercase !shadow-window-sm hover:!shadow-window-md !transition-all disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 window-lg bg-card z-50 overflow-hidden shadow-window-md">
          <div className="px-4 py-3 border-b-[1.5px] border-foreground">
            <p className="text-xs font-mono font-bold uppercase">Sign in to ChainShield</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              No signup — a wallet is created for you instantly.
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono hover:bg-muted/40 transition-smooth text-left disabled:opacity-60"
            >
              <GoogleGlyph />
              Continue with Google
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono hover:bg-muted/40 transition-smooth text-left disabled:opacity-60"
            >
              <span className="h-4 w-4 inline-flex items-center justify-center text-[13px]" aria-hidden>✉</span>
              Continue with Email
            </button>
          </div>
          <div className="px-4 py-2 border-t-[1.5px] border-foreground bg-muted/30">
            <p className="text-[9px] text-muted-foreground font-mono leading-relaxed">
              Demo mode. For real social login + on-chain wallets, set
              VITE_THIRDWEB_CLIENT_ID.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.2-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.6-1.7 12.8-4.7l-5.9-5c-1.8 1.3-4.1 2.2-6.9 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.3l5.9 5c-.4.4 6.4-4.7 6.4-14.3 0-1.2-.1-2.3-.3-3.5z" />
    </svg>
  );
}
