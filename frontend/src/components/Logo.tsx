import { Hexagon } from "lucide-react";

interface LogoProps {
  /** Hide the wordmark and show only the icon mark. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * MarketMap brand lockup: a purple-accent hexagon mark + wordmark. Reused in the
 * global header so it sits top-left on every screen.
 */
export function Logo({ iconOnly = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Hexagon
        className="h-6 w-6 fill-accent/10 text-accent drop-shadow-[0_0_6px_rgba(109,91,255,0.45)]"
        strokeWidth={2}
        aria-hidden
      />
      {!iconOnly && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          MarketMap
        </span>
      )}
    </span>
  );
}
