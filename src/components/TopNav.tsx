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
    <header className="sticky top-4 z-50 mx-4 md:mx-8">
      <nav className="window-lg flex h-14 items-center justify-between bg-card">
        <div className="flex items-center h-full">
          <div className="px-4 border-r-[1.5px] border-foreground h-full flex items-center">
            <Logo />
          </div>
          <div className="hidden md:flex items-center h-full">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="h-full px-4 flex items-center text-xs font-mono font-bold uppercase tracking-wider border-r-[1.5px] border-foreground hover:bg-primary hover:text-primary-foreground transition-smooth gap-2 before:content-[''] before:w-2 before:h-2 before:bg-foreground"
                activeClassName="bg-primary text-primary-foreground"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center h-full">
          <div className="hidden sm:flex items-center px-3 h-full border-l-[1.5px] border-foreground">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
          </div>
          <button className="md:hidden h-full px-4 border-l-[1.5px] border-foreground" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden window-lg mt-2 bg-card overflow-hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-[1.5px] border-foreground last:border-b-0"
              activeClassName="bg-primary text-primary-foreground"
            >
              {l.label}
            </NavLink>
          ))}
          <div className="p-3 sm:hidden border-t-[1.5px] border-foreground">
            <ConnectButton showBalance={false} />
          </div>
        </div>
      )}
    </header>
  );
};