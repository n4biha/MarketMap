/**
 * TypeScript mirror of the backend's `MarketBrief` pydantic schema
 * (backend/schemas/brief.py). Keys are snake_case so a JSON response from the
 * API deserializes straight into these types with no remapping.
 */

/** Qualitative scale shared by pain-point severity and opportunity scores. */
export type Level = "low" | "medium" | "high";

export interface UserPainPoint {
  description: string;
  severity: Level;
  evidence: string;
}

export interface CompetitorInsight {
  name: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
}

export interface MarketGap {
  description: string;
  rationale: string;
}

export interface OpportunityScore {
  market_crowding: Level;
  user_pain_intensity: Level;
  differentiation_potential: Level;
  execution_complexity: Level;
  overall: Level;
}

export interface ScoutData {
  web_results: string[];
  app_reviews: string[];
  play_reviews: string[];
  hn_posts: string[];
  producthunt_posts: string[];
  competitor_names: string[];
  scraped_app_names: string[];
  source_count: number;
}

export interface AnalystData {
  pain_points: UserPainPoint[];
  competitors: CompetitorInsight[];
  market_summary: string;
}

export interface StrategistData {
  opportunity_score: OpportunityScore;
  market_gaps: MarketGap[];
  recommended_angle: string;
  risks: string[];
}

export interface MarketBrief {
  idea: string;
  scout: ScoutData;
  analyst: AnalystData;
  strategist: StrategistData;
  generated_at: string;
  duration_seconds: number;
}
