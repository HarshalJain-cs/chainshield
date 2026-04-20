import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 group ${className}`}>
    <div className="relative">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="transition-smooth group-hover:scale-110">
        <defs>
          <linearGradient id="cs-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <path d="M16 2 L28 7 V17 C28 24 22 28.5 16 30 C10 28.5 4 24 4 17 V7 Z" fill="url(#cs-grad)" opacity="0.9" />
        <path d="M16 9 L22 12 V18 C22 21.5 19.3 23.8 16 24.5 C12.7 23.8 10 21.5 10 18 V12 Z" fill="hsl(var(--background))" />
        <path d="M13 16 L15.5 18.5 L19.5 14" stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
    <span className="font-display font-bold text-lg tracking-tight">ChainShield</span>
  </Link>
);