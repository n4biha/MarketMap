"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENTS, AgentPipeline } from "@/components/AgentPipeline";
import { LiveStatusCard } from "@/components/LiveStatusCard";
import { USE_MOCK, requestResearch } from "@/lib/api";
import { saveBrief } from "@/lib/briefStore";
import { mockBrief } from "@/lib/mockBrief";

const STEP_MS = 10000; // ~10s per agent over the ~50–60s run

/**
 * Research-progress screen. Fires the real backend call (POST /research) on
 * mount; the agent pipeline animation IS the loading state, stepping through the
 * agents (~10s each) and holding on Formatter until the brief returns, then it
 * saves the brief and navigates to /results. Set NEXT_PUBLIC_USE_MOCK="true" to
 * skip the backend and use the mock brief (timed) for dev.
 */
export function ResearchFlow({ idea }: { idea: string }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"running" | "done" | "error">("running");
  const [error, setError] = useState("");
  const ideaQuery = idea ? `?idea=${encodeURIComponent(idea)}` : "";

  // Kick off the work (real API call, or mock on a timer).
  useEffect(() => {
    let cancelled = false;

    if (USE_MOCK || !idea) {
      const t = setTimeout(() => {
        if (cancelled) return;
        saveBrief(mockBrief);
        setPhase("done");
      }, AGENTS.length * STEP_MS);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    requestResearch(idea)
      .then((brief) => {
        if (cancelled) return;
        saveBrief(brief);
        setPhase("done");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [idea]);

  // Step the pipeline glow one agent at a time, holding on the last (Formatter)
  // until the brief is ready — no looping back to the start.
  useEffect(() => {
    if (phase !== "running") return;
    if (activeIndex >= AGENTS.length - 1) return; // hold on Formatter
    const t = setTimeout(() => setActiveIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [activeIndex, phase]);

  // When the brief is ready, navigate to results (all agents shown complete
  // below via `phase`, so no extra state update is needed here).
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => router.push(`/results${ideaQuery}`), 1100);
    return () => clearTimeout(t);
  }, [phase, router, ideaQuery]);

  if (phase === "error") {
    return (
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Research couldn&apos;t finish</h1>
        <p className="text-muted">{error}</p>
        <Link href="/" className="btn-accent rounded-lg px-5 py-2.5 text-sm font-medium">
          Back to search
        </Link>
      </main>
    );
  }

  // When done, show every agent complete; otherwise follow the live index.
  const pipelineIndex = phase === "done" ? AGENTS.length : activeIndex;
  const current = AGENTS[Math.min(pipelineIndex, AGENTS.length - 1)];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-14 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Research in progress
        </h1>
        <p className="mt-3 text-base text-muted">
          Our AI agents are analyzing the market for you.
        </p>
      </div>

      <AgentPipeline activeIndex={pipelineIndex} />

      <LiveStatusCard key={current.name} agent={current} />
    </main>
  );
}
