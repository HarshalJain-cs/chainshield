import { useState, useRef, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { ThirdwebConnectButton } from "@/components/web3/ThirdwebConnectButton";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu, X, User, LayoutDashboard, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/cover", label: "Cover" },
  { to: "/app", label: "Dashboard" },
  { to: "/claims", label: "Claims" },
  { to: "/stake", label: "Stake" },
  { to: "/governance", label: "Governance" },
];

function ProfileDropdown() {
  const { user, address, isAdmin, isReviewer } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!address) return null;

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        id="profile-dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        className="h-full px-3 flex items-center gap-2 border-l-[1.5px] border-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
        aria-label="Profile menu"
      >
        <div className="h-6 w-6 border-[1.5px] border-foreground bg-primary/20 flex items-center justify-center text-[10px] font-bold font-mono">
          {user?.displayName?.charAt(0).toUpperCase() ?? address.slice(2, 4).toUpperCase()}
        </div>
        <span className="hidden sm:block text-[10px] font-mono">{shortAddr}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 window-lg bg-card z-50 overflow-hidden shadow-window-md">
          {/* User info */}
          <div className="px-4 py-3 border-b-[1.5px] border-foreground">
            <p className="text-xs font-mono font-bold">
              {user?.displayName ?? "Anonymous"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {user?.role ?? "policyholder"}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { navigate("/profile"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono hover:bg-muted/40 transition-smooth text-left"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              My Profile
            </button>

            {(isAdmin || isReviewer) && (
              <button
                onClick={() => { navigate("/admin"); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono hover:bg-muted/40 transition-smooth text-left text-primary"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Admin Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, isReviewer, isConnected } = useUser();

  const visibleLinks = isAdmin || isReviewer
    ? [...links, { to: "/admin", label: "Admin" }]
    : links;

  return (
    <header className="sticky top-4 z-50 mx-4 md:mx-8">
      <nav className="window-lg flex h-14 items-center justify-between bg-card">
        <div className="flex items-center h-full">
          <div className="px-4 border-r-[1.5px] border-foreground h-full flex items-center">
            <Logo />
          </div>
          <div className="hidden md:flex items-center h-full">
            {visibleLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={cn(
                  "h-full px-4 flex items-center text-xs font-mono font-bold uppercase tracking-wider",
                  "border-r-[1.5px] border-foreground hover:bg-primary hover:text-primary-foreground transition-smooth gap-2",
                  "before:content-[''] before:w-2 before:h-2 before:bg-foreground",
                  l.to === "/admin" && "text-primary before:bg-primary"
                )}
                activeClassName="bg-primary text-primary-foreground"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center h-full">
          {/* Notification bell — only shown when connected */}
          {isConnected && (
            <NotificationBell />
          )}

          {/* Wallet connect button */}
          <div className="hidden sm:flex items-center px-3 h-full border-l-[1.5px] border-foreground">
            <ThirdwebConnectButton />
          </div>

          {/* Profile dropdown (after wallet connect) */}
          {isConnected && <ProfileDropdown />}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden h-full px-4 border-l-[1.5px] border-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden window-lg mt-2 bg-card overflow-hidden">
          {visibleLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider",
                "border-b-[1.5px] border-foreground last:border-b-0",
                l.to === "/admin" && "text-primary"
              )}
              activeClassName="bg-primary text-primary-foreground"
            >
              {l.label}
            </NavLink>
          ))}
          <div className="p-3 sm:hidden border-t-[1.5px] border-foreground">
            <ThirdwebConnectButton />
          </div>
        </div>
      )}
    </header>
  );
};