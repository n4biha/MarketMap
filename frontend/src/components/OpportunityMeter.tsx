import type { Level } from "@/types/brief";
import { LEVEL_FRACTION, levelLabel } from "@/lib/levels";

interface OpportunityMeterProps {
  /** Dimension name, e.g. "User pain intensity". */
  label: string;
  level: Level;
  className?: string;
}

/**
 * A single labeled opportunity-score bar (low / medium / high). Purely
 * presentational and palette-driven, so it looks consistent on every screen.
 */
export function OpportunityMeter({
  label,
  level,
  className = "",
}: OpportunityMeterProps) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">{levelLabel(level)}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-border"
        role="meter"
        aria-valuenow={Math.round(LEVEL_FRACTION[level] * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={levelLabel(level)}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${LEVEL_FRACTION[level] * 100}%` }}
        />
      </div>
    </div>
  );
}
