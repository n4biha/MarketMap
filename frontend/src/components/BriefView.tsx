"use client";

import { useState } from "react";
import { Apple, Cat, Check, Globe, Minus, Play, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OpportunityBar } from "@/components/OpportunityBar";
import { useBrief } from "@/lib/useBrief";
import { buildDimensions } from "@/lib/dimensions";
import type { Level, MarketBrief } from "@/types/brief";

const CARD =
  "rounded-2xl border border-white/[0.07] bg-[#161721]/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7),inset_0_0_24px_-14px_rgba(109,91,255,0.35)]";
const SECTION_LABEL = "mb-5 text-sm font-medium uppercase tracking-[0.14em] text-muted";

const LEVEL_COLOR: Record<Level, string> = {
  high: "#F87171",
  medium: "#F5B544",
  low: "#34D399",
};
const LEVEL_BG: Record<Level, string> = {
  high: "rgba(248,113,113,0.14)",
  medium: "rgba(245,181,68,0.14)",
  low: "rgba(52,211,153,0.14)",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const MINOR = new Set(["a", "an", "the", "for", "of", "to", "and", "or", "in", "on", "with"]);
function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w, i) => {
      if (w && w === w.toUpperCase()) return w; // keep acronyms like ADHD
      const lower = w.toLowerCase();
      if (i !== 0 && MINOR.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

const TABS = ["Overview", "Competitors", "Insights", "Sources"] as const;
type Tab = (typeof TABS)[number];

function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ color: LEVEL_COLOR[level], background: LEVEL_BG[level] }}
    >
      {level}
    </span>
  );
}

export function BriefView({ idea }: { idea?: string }) {
  const brief = useBrief();
  const [tab, setTab] = useState<Tab>("Overview");
  const title = titleCase(idea && idea.trim() ? idea : brief.idea);

  return (
    <div>
      <h1 className="font-serif text-[44px] font-medium leading-[1.08] tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-3 text-lg text-muted">Comprehensive market brief</p>

      <div className="mt-8 flex gap-1 border-b border-white/[0.08]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "border-accent text-white"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "Overview" && <OverviewTab brief={brief} />}
        {tab === "Competitors" && <CompetitorsTab brief={brief} />}
        {tab === "Insights" && <InsightsTab brief={brief} />}
        {tab === "Sources" && <SourcesTab brief={brief} />}
      </div>
    </div>
  );
}

function OverviewTab({ brief }: { brief: MarketBrief }) {
  const score = brief.strategist.opportunity_score;
  const dimensions = buildDimensions(score);

  return (
    <div className="flex flex-col gap-8">
      <div className={`${CARD} p-8`}>
        <OpportunityBar level={score.overall} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${CARD} p-7`}>
          <h3 className={SECTION_LABEL}>Opportunity summary</h3>
          <p className="text-[15px] leading-[1.65] text-[#C7CAD6]">
            {brief.strategist.recommended_angle}
          </p>
        </div>

        <div className={`${CARD} p-7`}>
          <h3 className="mb-5 text-lg font-semibold text-white">Why {cap(score.overall)}?</h3>
          <ul className="space-y-3.5">
            {dimensions.map((d) => (
              <li key={d.label} className="flex items-start gap-3 text-[15px] text-[#C7CAD6]">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#9B8CFF]" aria-hidden />
                {d.reasonText}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className={SECTION_LABEL}>Key factors</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dimensions.map((d) => (
            <div key={d.label} className={`${CARD} p-6`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-white">{d.label}</p>
                <LevelBadge level={d.value} />
              </div>
              <p className="mt-3 text-[14px] leading-[1.5] text-[#9CA0B0]">{d.reasonText}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitorsTab({ brief }: { brief: MarketBrief }) {
  const { competitors } = brief.analyst;
  if (competitors.length === 0) {
    return <p className="text-muted">No competitors were identified in this run.</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      {competitors.map((c) => (
        <div key={c.name} className={`${CARD} p-7`}>
          <div className="mb-1 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6D5BFF]/[0.18] text-base font-semibold text-[#9B8CFF]">
              {c.name.charAt(0)}
            </span>
            <p className="text-lg font-semibold text-white">{c.name}</p>
          </div>
          <p className="mb-6 text-[15px] leading-[1.55] text-[#9CA0B0]">{c.positioning}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                Strengths
              </p>
              {c.strengths.length > 0 ? (
                <ul className="space-y-2.5">
                  {c.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-[#C7CAD6]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34D399]" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None noted in the research.</p>
              )}
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                Weaknesses
              </p>
              {c.weaknesses.length > 0 ? (
                <ul className="space-y-2.5">
                  {c.weaknesses.map((w) => (
                    <li key={w} className="flex items-start gap-2.5 text-sm text-[#C7CAD6]">
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[#F5B544]" aria-hidden />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None noted in the research.</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsTab({ brief }: { brief: MarketBrief }) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h3 className={SECTION_LABEL}>Pain points</h3>
        <div className="grid gap-5 lg:grid-cols-2">
          {brief.analyst.pain_points.map((p) => (
            <div key={p.description} className={`${CARD} p-6`}>
              <LevelBadge level={p.severity} />
              <p className="mt-3 text-base font-semibold text-white">{p.description}</p>
              <p className="mt-2.5 text-sm italic leading-[1.55] text-[#9CA0B0]">
                &ldquo;{p.evidence}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={SECTION_LABEL}>Market gaps</h3>
        <div className="grid gap-5 lg:grid-cols-2">
          {brief.strategist.market_gaps.map((g) => (
            <div key={g.description} className={`${CARD} p-6`}>
              <p className="text-base font-semibold text-white">{g.description}</p>
              <p className="mt-2.5 text-sm leading-[1.55] text-[#9CA0B0]">{g.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SourceChannel {
  label: string;
  items: string[];
  icon: LucideIcon;
  color: string;
}

// Sample up to 3 excerpts spread across the array (first / middle / last) rather
// than always the first, and truncate each to ~90 chars. Dedupes indices so short
// arrays don't repeat an item.
function sampleExcerpts(items: string[]): string[] {
  if (items.length === 0) return [];
  const last = items.length - 1;
  const idx = Array.from(new Set([0, Math.floor(last / 2), last]));
  return idx.map((i) => {
    const s = items[i].trim();
    return s.length > 90 ? `${s.slice(0, 90).trimEnd()}…` : s;
  });
}

function SourcesTab({ brief }: { brief: MarketBrief }) {
  const { scout } = brief;
  const channels: SourceChannel[] = [
    { label: "Web", items: scout.web_results, icon: Globe, color: "#6D5BFF" },
    { label: "App Store reviews", items: scout.app_reviews, icon: Apple, color: "#4DA3FF" },
    { label: "Google Play reviews", items: scout.play_reviews, icon: Play, color: "#34D399" },
    { label: "Hacker News", items: scout.hn_posts, icon: Terminal, color: "#FF7A1A" },
    { label: "Product Hunt", items: scout.producthunt_posts, icon: Cat, color: "#EC4899" },
  ];
  const present = channels.filter((c) => c.items.length > 0);
  const activeChannels = present.length;
  const total = channels.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* total summary */}
      <div className={`${CARD} flex items-center gap-4 p-7`}>
        <p className="font-serif text-4xl font-medium text-white">{scout.source_count}</p>
        <p className="text-[15px] text-muted">
          total sources collected across {activeChannels} channels
        </p>
      </div>

      {/* proportion bar */}
      {total > 0 && (
        <div className={`${CARD} p-7`}>
          <h3 className={SECTION_LABEL}>Source mix</h3>
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
            {present.map((c) => (
              <div
                key={c.label}
                className="h-full"
                style={{ width: `${(c.items.length / total) * 100}%`, background: c.color }}
                title={`${c.label}: ${c.items.length}`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {present.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-[#C7CAD6]">{c.label}</span>
                <span className="font-medium text-muted">{c.items.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* source cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {channels.map((ch) => {
          const excerpts = sampleExcerpts(ch.items);
          const Icon = ch.icon;
          return (
            <div key={ch.label} className={`${CARD} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `${ch.color}2E` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: ch.color }} aria-hidden />
                  </span>
                  <p className="text-base font-semibold text-white">{ch.label}</p>
                </div>
                <span className="text-sm font-medium text-[#9B8CFF]">{ch.items.length}</span>
              </div>
              {excerpts.length > 0 ? (
                <>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {excerpts.map((e, i) => (
                      <li key={i} className="text-sm leading-[1.5] text-[#9CA0B0]">
                        {e}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted">
                    Sample excerpts — not representative of all {ch.items.length} items
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">No sources from this channel.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
