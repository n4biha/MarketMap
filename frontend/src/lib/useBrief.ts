"use client";

import { useSyncExternalStore } from "react";
import { BRIEF_KEY } from "@/lib/briefStore";
import { mockBrief } from "@/lib/mockBrief";
import type { MarketBrief } from "@/types/brief";

// Cache the parsed brief keyed by the raw string so getSnapshot returns a stable
// reference (required by useSyncExternalStore — otherwise it re-renders forever).
let cachedRaw: string | null = null;
let cachedBrief: MarketBrief = mockBrief;

function subscribe(): () => void {
  // The brief is written once per run (no live updates within a view), so there
  // is nothing to subscribe to.
  return () => {};
}

function getSnapshot(): MarketBrief {
  if (typeof window === "undefined") return mockBrief;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(BRIEF_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedBrief = raw ? (JSON.parse(raw) as MarketBrief) : mockBrief;
    } catch {
      cachedBrief = mockBrief;
    }
  }
  return cachedBrief;
}

function getServerSnapshot(): MarketBrief {
  return mockBrief;
}

/**
 * Returns the brief to render: the one saved by the research flow, or `mockBrief`
 * as a dev fallback when none is stored (e.g. landing directly on /results).
 */
export function useBrief(): MarketBrief {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
