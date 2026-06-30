import type { Level, OpportunityScore } from "@/types/brief";

export interface Dimension {
  label: string;
  value: Level;
  // Resolved explanation: the backend's idea-specific reason when present,
  // otherwise the generic per-level fallback below.
  reasonText: string;
}

// Generic per-level fallback text, used only when the backend brief omits the
// idea-specific *_reason field (e.g. the dev mock or an older saved brief).
export const FALLBACK_REASON: Record<string, Record<Level, string>> = {
  "Market Crowding": {
    low: "Market is wide open",
    medium: "Market is moderately competitive",
    high: "Market is highly crowded",
  },
  "User Pain": {
    low: "Users feel only mild pain",
    medium: "Users feel moderate pain",
    high: "Users face strong, real pain points",
  },
  Differentiation: {
    low: "Hard to stand out from incumbents",
    medium: "Some room to differentiate",
    high: "Clear differentiation is possible",
  },
  "Execution Complexity": {
    low: "Low execution effort required",
    medium: "Moderate execution effort required",
    high: "High execution effort required",
  },
};

export function buildDimensions(score: OpportunityScore): Dimension[] {
  const resolve = (label: string, value: Level, reason?: string): Dimension => ({
    label,
    value,
    reasonText: reason?.trim() || FALLBACK_REASON[label][value],
  });
  return [
    resolve("Market Crowding", score.market_crowding, score.market_crowding_reason),
    resolve("User Pain", score.user_pain_intensity, score.user_pain_intensity_reason),
    resolve(
      "Differentiation",
      score.differentiation_potential,
      score.differentiation_potential_reason,
    ),
    resolve(
      "Execution Complexity",
      score.execution_complexity,
      score.execution_complexity_reason,
    ),
  ];
}
