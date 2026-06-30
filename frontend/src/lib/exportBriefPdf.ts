import { jsPDF } from "jspdf";
import type { MarketBrief } from "@/types/brief";
import { buildDimensions } from "@/lib/dimensions";

// Clean, light, print-friendly PDF built programmatically from the in-memory
// MarketBrief — no DOM rasterization, so it's independent of the app's theme.

const ACCENT: [number, number, number] = [109, 91, 255]; // #6D5BFF brand purple
const INK: [number, number, number] = [33, 33, 40]; // near-black body text
const MUTED: [number, number, number] = [120, 120, 135]; // secondary text

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// jsPDF draws text literally, but the LLM writes some fields (e.g. market_summary)
// in Markdown. Strip the syntax so it doesn't show as `**bold**` / `- ` artifacts.
function mdToPlain(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, "") // heading hashes
    .replace(/^\s*[-*+]\s+/gm, "• ") // list markers → bullet
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic (leave lone _ alone)
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*/g, ""); // any stray leftover markers
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "brief"
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function exportBriefPdf(brief: MarketBrief): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  // --- low-level helpers -------------------------------------------------- //
  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const text = (
    s: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number; indent?: number } = {},
  ) => {
    const size = opts.size ?? 10.5;
    const indent = opts.indent ?? 0;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? INK));
    const lineH = size * 1.35;
    const lines = doc.splitTextToSize(mdToPlain(s), contentW - indent) as string[];
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, margin + indent, y);
      y += lineH;
    }
    y += opts.gap ?? 0;
  };

  const heading = (label: string) => {
    ensure(34);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT);
    doc.text(label.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  };

  const bullet = (s: string) => {
    text(`•  ${s}`, { indent: 0 });
  };

  // --- header ------------------------------------------------------------- //
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  doc.text("MarketMap", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const sub = "Market Brief" + (brief.generated_at ? `  ·  ${formatDate(brief.generated_at)}` : "");
  doc.text(sub, pageW - margin, y, { align: "right" });
  y += 14;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.4);
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  // Idea (document title)
  text(brief.idea, { size: 18, bold: true, color: INK, gap: 4 });

  const { strategist, analyst, scout } = brief;
  const score = strategist.opportunity_score;

  // --- opportunity -------------------------------------------------------- //
  heading("Opportunity");
  text(`Overall: ${cap(score.overall)}`, { size: 13, bold: true, gap: 8 });
  for (const d of buildDimensions(score)) {
    text(`${d.label} — ${cap(d.value)}`, { size: 10.5, bold: true });
    text(d.reasonText, { color: MUTED, gap: 6 });
  }

  // --- recommended angle -------------------------------------------------- //
  heading("Recommended Angle");
  text(strategist.recommended_angle || "—", { gap: 2 });

  // --- market summary ----------------------------------------------------- //
  if (analyst.market_summary?.trim()) {
    heading("Market Summary");
    text(analyst.market_summary, { gap: 2 });
  }

  // --- pain points -------------------------------------------------------- //
  heading("Top Pain Points");
  if (analyst.pain_points.length) {
    for (const p of analyst.pain_points) {
      text(`[${cap(p.severity)}]  ${p.description}`, { bold: true });
      if (p.evidence?.trim()) text(`Evidence: ${p.evidence}`, { size: 9.5, color: MUTED });
      y += 4;
    }
  } else {
    text("None found in the research.", { color: MUTED });
  }

  // --- competitors -------------------------------------------------------- //
  heading("Competitors");
  if (analyst.competitors.length) {
    for (const c of analyst.competitors) {
      text(c.name, { size: 12, bold: true });
      if (c.positioning?.trim()) text(c.positioning, { color: MUTED, gap: 4 });
      text("Strengths", { size: 10, bold: true, color: ACCENT });
      if (c.strengths.length) c.strengths.forEach((s) => bullet(s));
      else text("None noted in the research.", { color: MUTED });
      text("Weaknesses", { size: 10, bold: true, color: ACCENT });
      if (c.weaknesses.length) c.weaknesses.forEach((w) => bullet(w));
      else text("None noted in the research.", { color: MUTED });
      y += 8;
    }
  } else {
    text("None found in the research.", { color: MUTED });
  }

  // --- market gaps -------------------------------------------------------- //
  heading("Market Gaps");
  if (strategist.market_gaps.length) {
    for (const g of strategist.market_gaps) {
      text(g.description, { bold: true });
      if (g.rationale?.trim()) text(g.rationale, { color: MUTED, gap: 6 });
    }
  } else {
    text("None identified.", { color: MUTED });
  }

  // --- risks -------------------------------------------------------------- //
  heading("Key Risks");
  if (strategist.risks.length) {
    strategist.risks.forEach((r) => bullet(r));
  } else {
    text("None noted.", { color: MUTED });
  }

  // --- sources ------------------------------------------------------------ //
  heading("Sources");
  text(`${scout.source_count} sources analyzed`, { bold: true, gap: 6 });
  const channels: [string, number][] = [
    ["Web", scout.web_results.length],
    ["App Store reviews", scout.app_reviews.length],
    ["Google Play reviews", scout.play_reviews.length],
    ["Hacker News", scout.hn_posts.length],
    ["Product Hunt", scout.producthunt_posts.length],
  ];
  channels.filter(([, n]) => n > 0).forEach(([label, n]) => bullet(`${label}: ${n}`));

  doc.save(`marketmap-${slugify(brief.idea)}.pdf`);
}
