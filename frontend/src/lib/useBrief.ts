"use client";

import { useSyncExternalStore } from "react";
import { BRIEF_KEY } from "@/lib/briefStore";
import type { MarketBrief } from "@/types/brief";

// Cache the parsed brief keyed by the raw string so getSnapshot returns a stable
// reference (required by useSyncExternalStore — otherwise it re-renders forever).
let cachedRaw: string | null = null;
let cachedBrief: MarketBrief | null = null;

function subscribe(): () => void {
  // The brief is written once per run (no live updates within a view), so there
  // is nothing to subscribe to.
  return () => {};
}

function getSnapshot(): MarketBrief | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(BRIEF_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedBrief = raw ? (JSON.parse(raw) as MarketBrief) : null;
    } catch {
      cachedBrief = null;
    }
  }
  return cachedBrief;
}

function getServerSnapshot(): MarketBrief | null {
  return null;
}

/**
 * Returns the brief saved by the research flow, or `null` when none is stored
 * (e.g. landing directly on /results or /brief). Callers should redirect home
 * when this is `null`.
 */
export function useBrief(): MarketBrief | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
