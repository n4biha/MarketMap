import type { MarketBrief } from "@/types/brief";

// Backend base URL (override with NEXT_PUBLIC_API_URL). Default = local dev.
// Use 127.0.0.1 (not "localhost") so the browser hits IPv4 — uvicorn binds
// 127.0.0.1 only, and "localhost" can resolve to IPv6 ::1, causing "Failed to
// fetch".
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Dev toggle: when "true", the flow skips the backend and uses mockBrief.ts.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** POST an idea to the backend pipeline and return the full MarketBrief. */
export async function requestResearch(idea: string): Promise<MarketBrief> {
  const res = await fetch(`${API_BASE}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.detail ?? "";
    } catch {
      // ignore — fall back to a generic message
    }
    throw new Error(detail || `Research request failed (${res.status})`);
  }

  return (await res.json()) as MarketBrief;
}
