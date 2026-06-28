import type { MarketBrief } from "@/types/brief";

// The fetched brief is held in sessionStorage so it survives the client
// navigation from /research → /results → /brief (and a refresh within the tab).
export const BRIEF_KEY = "marketmap:brief";

export function saveBrief(brief: MarketBrief): void {
  try {
    sessionStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
  } catch {
    // sessionStorage unavailable (SSR / privacy mode) — ignore.
  }
}
