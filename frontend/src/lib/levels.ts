import type { Level } from "@/types/brief";

/** How "full" each qualitative level renders in meters/bars (0–1). */
export const LEVEL_FRACTION: Record<Level, number> = {
  low: 1 / 3,
  medium: 2 / 3,
  high: 1,
};

/** Capitalized label for display, e.g. "high" -> "High". */
export function levelLabel(level: Level): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
