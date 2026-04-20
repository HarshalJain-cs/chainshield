import { Logo } from "@/components/Logo";
import { Github, Twitter } from "lucide-react";

export const Footer = () => (
  <footer className="mx-4 md:mx-8 mt-24 mb-6">
    <div className="window-lg bg-card overflow-hidden">
      <div className="window-bar">
        <span className="font-mono text-[9px] uppercase font-bold tracking-wider">footer.exe</span>
      </div>
      <div className="grid gap-10 md:grid-cols-4 p-8">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Onchain insurance for DeFi. Cover, claims & governance — all onchain.
          </p>
        </div>
        <FooterCol title="Product" links={[
          ["Cover marketplace", "/cover"],
          ["Earn yield", "/stake"],
          ["File a claim", "/claims"],
          ["Governance", "/governance"],
        ]} />
        <FooterCol title="Resources" links={[
          ["Documentation", "#"],
          ["Whitepaper", "#"],
          ["Audits", "#"],
          ["Bug bounty", "#"],
        ]} />
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider mb-4">Community</h4>
          <div className="flex items-center gap-2">
            <a href="#" className="p-2 border-[1.5px] border-foreground bg-card hover:bg-primary transition-smooth" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="p-2 border-[1.5px] border-foreground bg-card hover:bg-primary transition-smooth" aria-label="GitHub"><Github className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t-[1.5px] border-foreground px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p className="font-mono">© {new Date().getFullYear()} ChainShield Protocol</p>
        <p className="font-mono flex items-center gap-2">
          <span className="w-2 h-2 bg-secondary border border-foreground animate-blink" /> v0.1.0 · all systems operational
        </p>
      </div>
    </div>
  </footer>
);

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(([l, h]) => (
          <li key={l}><a href={h} className="hover:text-primary underline-offset-4 hover:underline">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}