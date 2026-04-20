import { Logo } from "@/components/Logo";
import { Github, Twitter, FileCheck2 } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border/60 mt-24">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="space-y-3">
        <Logo />
        <p className="text-sm text-muted-foreground max-w-xs">
          Decentralized insurance for DeFi. Onchain cover, onchain claims, onchain governance.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3">Product</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="/cover" className="hover:text-foreground">Cover marketplace</a></li>
          <li><a href="/stake" className="hover:text-foreground">Earn yield</a></li>
          <li><a href="/claims" className="hover:text-foreground">File a claim</a></li>
          <li><a href="/governance" className="hover:text-foreground">Governance</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3">Resources</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="hover:text-foreground">Documentation</a></li>
          <li><a href="#" className="hover:text-foreground">Whitepaper</a></li>
          <li><a href="#" className="hover:text-foreground inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" /> Audits</a></li>
          <li><a href="#" className="hover:text-foreground">Bug bounty</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3">Community</h4>
        <div className="flex items-center gap-3">
          <a href="#" className="p-2 rounded-md border border-border hover:border-primary/60 hover:text-primary transition-smooth" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
          <a href="#" className="p-2 rounded-md border border-border hover:border-primary/60 hover:text-primary transition-smooth" aria-label="GitHub"><Github className="h-4 w-4" /></a>
        </div>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} ChainShield Protocol. Onchain & open-source.</p>
        <p className="font-mono">v0.1.0 · all systems operational</p>
      </div>
    </div>
  </footer>
);