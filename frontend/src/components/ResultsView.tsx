"use client";

import { ArrowRight, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { OpportunityBar } from "@/components/OpportunityBar";
import { useBrief } from "@/lib/useBrief";

const CARD =
  "rounded-2xl border border-white/[0.07] bg-[#161721]/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7),inset_0_0_24px_-14px_rgba(109,91,255,0.35)]";
const SECTION_LABEL = "mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted";

// Decorative, idea-agnostic icons cycled across the takeaway cards.
const TAKEAWAY_ICONS: LucideIcon[] = [Lightbulb, Target, TrendingUp, Sparkles];

/** First ~6 words of the gap description as a card title (capitalized, … if cut). */
function deriveTitle(description: string): string {
  const words = description.trim().split(/\s+/);
  const TAKE = 6;
  const slice = words.slice(0, TAKE).join(" ").replace(/[.,;:]+$/, "");
  const title = slice.charAt(0).toUpperCase() + slice.slice(1);
  return words.length > TAKE ? `${title}…` : title;
}

/** First ~2 sentences of the gap rationale, capped at ~100 chars. */
function deriveBody(rationale: string): string {
  const sentences = rationale.trim().match(/[^.!?]+[.!?]+/g);
  let text = (sentences ? sentences.slice(0, 2).join(" ") : rationale).trim();
  if (text.length > 100) {
    text = text.slice(0, 100).replace(/\s+\S*$/, "").replace(/[.,;:]+$/, "") + "…";
  }
  return text;
}

export function ResultsView({ idea }: { idea?: string }) {
  const brief = useBrief();
  const ideaQuery = idea ? `?idea=${encodeURIComponent(idea)}` : "";
  const { strategist, analyst } = brief;

  // Key takeaways: derived entirely from the real market_gaps — no hardcoding.
  const takeaways = strategist.market_gaps
    .filter((g) => g.description)
    .map((g, i) => ({
      title: deriveTitle(g.description),
      body: deriveBody(g.rationale),
      icon: TAKEAWAY_ICONS[i % TAKEAWAY_ICONS.length],
    }));

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center gap-16 px-10 py-12">
      {/* heading + opportunity meter */}
      <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
            Research complete
          </span>
          <h1 className="mt-5 max-w-[560px] font-serif text-[54px] font-medium leading-[1.08] tracking-tight text-white">
            Here&apos;s your market overview
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Key insights, competitors, and opportunities at a glance.
          </p>
          <Link
            href={`/brief${ideaQuery}`}
            className="btn-accent mt-6 inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            View full brief
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className={`${CARD} p-8`}>
          <OpportunityBar level={strategist.opportunity_score.overall} />
        </div>
      </div>

      {/* key takeaways */}
      <section>
        <h2 className={SECTION_LABEL}>Key takeaways</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {takeaways.map((t, i) => (
            <div key={i} className={`${CARD} p-7`}>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#6D5BFF]/[0.18]">
                <t.icon className="h-6 w-6 text-[#9B8CFF]" aria-hidden />
              </div>
              <p className="text-lg font-semibold text-white">{t.title}</p>
              <p className="mt-2.5 line-clamp-3 text-[15px] leading-[1.55] text-[#9CA0B0]">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* top competitors */}
      <section>
        <h2 className={SECTION_LABEL}>Top competitors</h2>
        <div className="flex flex-wrap gap-5">
          {analyst.competitors.map((c) => (
            <Link
              key={c.name}
              href={`/brief${ideaQuery}`}
              className={`${CARD} flex w-80 items-center gap-4 p-6 transition-colors hover:border-accent/40`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6D5BFF]/[0.18] text-lg font-semibold text-[#9B8CFF]">
                {c.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{c.name}</p>
                <p className="line-clamp-1 text-sm leading-[1.5] text-[#9CA0B0]">{c.positioning}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
