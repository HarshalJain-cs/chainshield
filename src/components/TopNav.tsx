import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/cover", label: "Cover" },
  { to: "/app", label: "Dashboard" },
  { to: "/claims", label: "Claims" },
  { to: "/stake", label: "Stake" },
  { to: "/governance", label: "Governance" },
];

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <nav className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-smooth"
                activeClassName="text-foreground bg-muted/60"
              >
                {l.label}
              </NavLink>
            ))}
            <a href="https://docs.lovable.dev" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Docs
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground"
                activeClassName="text-foreground bg-muted/60"
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 sm:hidden">
              <ConnectButton showBalance={false} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};