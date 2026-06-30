"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENTS, AgentPipeline } from "@/components/AgentPipeline";
import { LiveStatusCard } from "@/components/LiveStatusCard";
import { USE_MOCK, streamResearch } from "@/lib/api";
import { saveBrief } from "@/lib/briefStore";
import { mockBrief } from "@/lib/mockBrief";

const STEP_MS = 10000; // mock-mode only: ~10s per agent
// Pipeline node name → its position in AGENTS (Scout, Analyst, Strategist, Formatter).
const NODE_INDEX: Record<string, number> = {
  scout: 0,
  analyst: 1,
  strategist: 2,
  formatter: 3,
};

/**
 * Research-progress screen. On a real run it streams the backend pipeline
 * (GET /research/stream) and advances the agent pipeline as each agent actually
 * completes, holding on Formatter until the brief returns, then saves the brief
 * and navigates to /results. Set NEXT_PUBLIC_USE_MOCK="true" (or open with no
 * idea) to skip the backend and animate the mock brief on a timer instead.
 */
export function ResearchFlow({ idea }: { idea: string }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"running" | "done" | "error">("running");
  const [error, setError] = useState("");
  const ideaQuery = idea ? `?idea=${encodeURIComponent(idea)}` : "";
  const useMockFlow = USE_MOCK || !idea;

  // Kick off the work: real run streams agent-completion events; mock uses a timer.
  useEffect(() => {
    let cancelled = false;

    if (useMockFlow) {
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

    const stop = streamResearch(idea, {
      onNode: (node) => {
        if (cancelled) return;
        const completed = NODE_INDEX[node];
        // A node finishing means the next agent is now active (clamp to last).
        if (completed !== undefined) {
          setActiveIndex((i) =>
            Math.max(i, Math.min(completed + 1, AGENTS.length - 1)),
          );
        }
      },
      onDone: (brief) => {
        if (cancelled) return;
        saveBrief(brief);
        setPhase("done");
      },
      onError: (msg) => {
        if (cancelled) return;
        setError(msg || "Something went wrong.");
        setPhase("error");
      },
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [idea, useMockFlow]);

  // Mock-mode only: step the glow on a timer. Real runs advance via stream events.
  useEffect(() => {
    if (!useMockFlow || phase !== "running") return;
    if (activeIndex >= AGENTS.length - 1) return; // hold on Formatter
    const t = setTimeout(() => setActiveIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [activeIndex, phase, useMockFlow]);

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
