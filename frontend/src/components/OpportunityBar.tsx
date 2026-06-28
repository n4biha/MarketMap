import type { Level } from "@/types/brief";

// Active-segment position + colour + bloom for each level (no slider knob —
// the active third of the bar simply glows brighter).
const SEGMENTS: Record<Level, { left: string; color: string; round: string; glow: string }> = {
  low: { left: "0%", color: "#6D5BFF", round: "rounded-l-full", glow: "rgba(109,91,255,0.70)" },
  medium: { left: "33.333%", color: "#F5B544", round: "", glow: "rgba(245,181,68,0.70)" },
  high: { left: "66.666%", color: "#B14FE0", round: "rounded-r-full", glow: "rgba(177,79,224,0.75)" },
};

const LABEL_COLOR: Record<Level, string> = {
  low: "#6D5BFF",
  medium: "#F5B544",
  high: "#B14FE0",
};

const LABEL_TEXT: Record<Level, string> = {
  low: "Low",
  medium: "Medium",
  high: "High Opportunity",
};

/**
 * Opportunity meter: a static 3-colour gradient bar (purple → amber → magenta).
 * The active third (from `opportunity_score.overall`) glows brighter with a soft
 * bloom; the matching label is brighter and bolder. No input/knob.
 */
export function OpportunityBar({
  level,
  className = "",
}: {
  level: Level;
  className?: string;
}) {
  const seg = SEGMENTS[level];
  return (
    <div className={className}>
      <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
        Opportunity
      </p>
      <div
        className="relative h-3.5 w-full rounded-full"
        style={{ background: "linear-gradient(90deg, #6D5BFF 0%, #F5B544 50%, #B14FE0 100%)" }}
      >
        <div
          className={`absolute inset-y-0 w-1/3 ${seg.round}`}
          style={{
            left: seg.left,
            background: seg.color,
            boxShadow: `0 0 22px 4px ${seg.glow}`,
          }}
        />
      </div>
      <div className="mt-3.5 flex items-center justify-between text-sm">
        {(["low", "medium", "high"] as Level[]).map((lv) => (
          <span
            key={lv}
            className={lv === level ? "font-semibold" : "font-medium opacity-55"}
            style={{ color: LABEL_COLOR[lv] }}
          >
            {LABEL_TEXT[lv]}
          </span>
        ))}
      </div>
    </div>
  );
}
