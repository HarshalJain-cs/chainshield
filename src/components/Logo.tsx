import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 group ${className}`}>
    <span className="inline-block w-3.5 h-3.5 bg-foreground" />
    <span className="font-mono font-bold text-base tracking-tight uppercase">ChainShield</span>
  </Link>
);