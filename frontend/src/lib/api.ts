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

/** Discriminated union of the events the SSE endpoint emits. */
type StreamEvent =
  | { type: "node"; node: string }
  | { type: "done"; brief: MarketBrief }
  | { type: "error"; detail: string };

/**
 * Stream pipeline progress from GET /research/stream via EventSource.
 * Calls onNode as each agent finishes, then onDone with the brief (or onError).
 * Returns a cancel function that closes the connection.
 */
export function streamResearch(
  idea: string,
  handlers: {
    onNode?: (node: string) => void;
    onDone: (brief: MarketBrief) => void;
    onError: (message: string) => void;
  },
): () => void {
  const url = `${API_BASE}/research/stream?idea=${encodeURIComponent(idea)}`;
  const es = new EventSource(url);
  let settled = false; // guards against EventSource's onerror firing after done

  es.onmessage = (e) => {
    let evt: StreamEvent;
    try {
      evt = JSON.parse(e.data) as StreamEvent;
    } catch {
      return; // ignore unparseable frames
    }
    if (evt.type === "node") {
      handlers.onNode?.(evt.node);
    } else if (evt.type === "done") {
      settled = true;
      handlers.onDone(evt.brief);
      es.close();
    } else if (evt.type === "error") {
      settled = true;
      handlers.onError(evt.detail || "Research failed.");
      es.close();
    }
  };

  es.onerror = () => {
    if (settled) return; // normal close after we already finished — ignore
    settled = true;
    handlers.onError("Lost connection to the research stream.");
    es.close();
  };

  return () => {
    settled = true;
    es.close();
  };
}
