"""Agent 3 — Strategist: higher-order reasoning and opportunity scoring.

A single Claude Opus call, constrained to the StrategistData schema, reasons
over the Analyst's distilled insights and returns:
  - opportunity_score across four dimensions (+ overall)
  - market gaps a new entrant could target
  - the single sharpest recommended angle
  - key risks

Output is strict typed JSON (via .with_structured_output) — no freeform text.
"""

from __future__ import annotations

import logging

from dotenv import load_dotenv

from schemas.brief import AnalystData, StrategistData
from schemas.state import MarketMapState

load_dotenv()
logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-8"
MAX_TOKENS = 3000

_INSTRUCTION = """\
You are a senior product strategist. Based ONLY on the market research below,
assess the opportunity for this app idea.

Score each of the four opportunity dimensions as "low", "medium", or "high".
Mind the direction of each:
  - market_crowding: high = the market is saturated with competitors
  - user_pain_intensity: high = users feel severe, frequent pain
  - differentiation_potential: high = lots of room to stand out from incumbents
  - execution_complexity: high = hard or costly to build and ship
Then give an overall opportunity rating weighing all four.

For each of the four dimensions, also write ONE concise sentence justifying its
score (the *_reason fields), specific to this idea and grounded in the research
above — reference concrete incumbents, complaints, or whitespace where you can.
Do not merely restate the level word ("it is high because it is high"); explain
why.

Also: identify concrete market gaps a new entrant could target (each with a
rationale tied to the research), recommend the single sharpest angle for this
idea, and list the key risks. Be specific and honest — do not invent demand or
competitors the research does not support.

Wording: use clear, everyday words instead of fancy, technical, or buzzword
language. Keep ALL of the detail, specifics, names, and substance — do not
shorten, summarize away, or drop anything. Only simplify the vocabulary, not the
content.
"""


def _format_context(idea: str, analyst: AnalystData) -> str:
    """Render the Analyst's output into a prompt-friendly text block."""
    lines: list[str] = [f"App idea: {idea}", ""]

    lines.append("Market summary:")
    lines.append(analyst.market_summary or "(none)")
    lines.append("")

    lines.append("User pain points:")
    if analyst.pain_points:
        for p in analyst.pain_points:
            lines.append(f"- [{p.severity}] {p.description} (evidence: {p.evidence})")
    else:
        lines.append("- (none found)")
    lines.append("")

    lines.append("Competitors:")
    if analyst.competitors:
        for c in analyst.competitors:
            lines.append(
                f"- {c.name}: strengths={c.strengths}; "
                f"weaknesses={c.weaknesses}; positioning={c.positioning or 'n/a'}"
            )
    else:
        lines.append("- (none found)")

    return "\n".join(lines)


def _llm():
    """Lazily construct the ChatAnthropic client (no temperature — removed on
    Opus 4.8)."""
    from langchain_anthropic import ChatAnthropic

    return ChatAnthropic(model=MODEL, max_tokens=MAX_TOKENS)


def run_strategist(state: MarketMapState) -> dict:
    """LangGraph node for Agent 3.

    One schema-constrained Claude call over the full Analyst context produces
    the StrategistData written to state.
    """
    idea = state["idea"]
    analyst = state.get("analyst_data") or AnalystData()

    prompt = f"{_INSTRUCTION}\n\n{_format_context(idea, analyst)}"
    logger.info("Strategist scoring opportunity for idea: %s", idea)

    strategist_data: StrategistData = (
        _llm().with_structured_output(StrategistData).invoke(prompt)
    )

    logger.info(
        "Strategist overall opportunity: %s (%d gaps, %d risks)",
        strategist_data.opportunity_score.overall,
        len(strategist_data.market_gaps),
        len(strategist_data.risks),
    )
    return {"strategist_data": strategist_data}
