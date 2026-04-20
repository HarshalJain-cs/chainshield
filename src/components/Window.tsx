import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Retro window-frame card with optional title bar. */
export const Window = ({
  title,
  tag,
  tagColor = "primary",
  children,
  className,
  hover = false,
  large = false,
}: {
  title?: string;
  tag?: string;
  tagColor?: "primary" | "secondary" | "accent" | "muted";
  children: ReactNode;
  className?: string;
  hover?: boolean;
  large?: boolean;
}) => {
  const tagBg = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    muted: "bg-muted",
  }[tagColor];

  return (
    <div className={cn(large ? "window-lg" : "window", "bg-card overflow-hidden", hover && "hover-lift", className)}>
      {title && (
        <div className="window-bar justify-between !h-6">
          <div className="flex items-center gap-2">
            {tag && (
              <span className={cn("inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border-[1.5px] border-foreground", tagBg)}>
                <span className="w-1.5 h-1.5 bg-foreground" />
                {tag}
              </span>
            )}
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider truncate">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 border-[1.5px] border-foreground" />
            <span className="w-2 h-2 border-[1.5px] border-foreground" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
};