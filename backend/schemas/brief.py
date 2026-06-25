"""Pydantic v2 schemas for the MarketMap pipeline.

Every payload passed between agents is one of these typed models — never a raw
string. The sub-models and agent-output models here also double as the
structured-output schemas that Claude is constrained to (via LangChain's
``.with_structured_output(...)``), so each field carries a ``description`` that
tells the model exactly what to put there.

Defined in dependency order: sub-models first, then the four agent payloads,
then the final brief.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# Reusable qualitative scale used by pain-point severity and opportunity scores.
Level = Literal["low", "medium", "high"]


# --------------------------------------------------------------------------- #
# Sub-models (the building blocks the agent payloads are made of)
# --------------------------------------------------------------------------- #


class UserPainPoint(BaseModel):
    """A single user frustration extracted from the research.

    Produced by the Analyst (RAG query 1); consumed by the Strategist and
    surfaced in the final brief by the Formatter.
    """

    description: str = Field(description="The user pain point, stated plainly.")
    severity: Level = Field(description="How acutely users feel this pain.")
    evidence: str = Field(
        description="A short quote or paraphrase from the source data that grounds "
        "this pain point. Must come from the retrieved research, not invented."
    )


class CompetitorInsight(BaseModel):
    """An existing product in the space and what's notable about it.

    Produced by the Analyst (RAG query 2); consumed by the Strategist and
    surfaced in the final brief by the Formatter.
    """

    name: str = Field(description="The competitor's product or company name.")
    strengths: list[str] = Field(
        default_factory=list, description="What this competitor does well."
    )
    weaknesses: list[str] = Field(
        default_factory=list,
        description="Gaps, complaints, or weaknesses observed in the research.",
    )
    positioning: str = Field(
        default="",
        description="How this competitor positions itself in the market.",
    )


class MarketGap(BaseModel):
    """An unmet need or underserved segment — a wedge for a new entrant.

    Produced by the Strategist by reasoning over the Analyst's pain points and
    competitor insights.
    """

    description: str = Field(description="The unmet need or opportunity gap.")
    rationale: str = Field(
        description="Why this is a real gap, tied back to the observed pain points "
        "and competitor weaknesses."
    )


class OpportunityScore(BaseModel):
    """The Strategist's qualitative scoring across four dimensions, plus an
    overall read. Each is "low" | "medium" | "high".

    Note the directionality the model must respect when scoring:
      - market_crowding: high = many incumbents (worse for a new entrant)
      - user_pain_intensity: high = users hurt a lot (better — real demand)
      - differentiation_potential: high = lots of room to stand out (better)
      - execution_complexity: high = harder/costlier to build (worse)
    """

    market_crowding: Level = Field(
        description="How crowded the market is. high = saturated with competitors."
    )
    user_pain_intensity: Level = Field(
        description="How strongly users feel the pain. high = severe, frequent pain."
    )
    differentiation_potential: Level = Field(
        description="Room to differentiate. high = easy to stand out from incumbents."
    )
    execution_complexity: Level = Field(
        description="How hard this is to build and ship. high = very complex."
    )
    overall: Level = Field(
        description="Overall opportunity attractiveness, weighing all four dimensions."
    )


# --------------------------------------------------------------------------- #
# Agent payloads
# --------------------------------------------------------------------------- #


class ScoutData(BaseModel):
    """Agent 1 (Scout) output: raw collected data, zero analysis.

    Just the unprocessed text Scout gathered from each source, plus a count the
    pipeline uses to decide whether there's enough signal to proceed.
    """

    web_results: list[str] = Field(
        default_factory=list, description="Raw text snippets from Tavily web search."
    )
    reddit_posts: list[str] = Field(
        default_factory=list,
        description="Raw Reddit post/comment text (may be empty if Reddit was "
        "unavailable — Scout degrades gracefully).",
    )
    app_reviews: list[str] = Field(
        default_factory=list, description="Raw App Store review text."
    )
    competitor_names: list[str] = Field(
        default_factory=list,
        description="Candidate competitor names surfaced during collection.",
    )
    source_count: int = Field(
        default=0,
        description="Total number of source items collected across all channels. "
        "The pipeline routes to the error node if this is below 3.",
    )


class AnalystData(BaseModel):
    """Agent 2 (Analyst) output: structured insights from the RAG pipeline.

    Built from three separate, schema-constrained Claude calls — one per field —
    each grounded only in chunks retrieved from ChromaDB.
    """

    pain_points: list[UserPainPoint] = Field(
        default_factory=list, description="User pain points found in the research."
    )
    competitors: list[CompetitorInsight] = Field(
        default_factory=list, description="Competitor insights found in the research."
    )
    market_summary: str = Field(
        default="",
        description="A grounded narrative summary of the market landscape.",
    )


class StrategistData(BaseModel):
    """Agent 3 (Strategist) output: higher-order reasoning and scoring.

    Produced by a single Claude call constrained to this exact schema — strict
    typed JSON, no freeform text.
    """

    opportunity_score: OpportunityScore = Field(
        description="Qualitative scores across the four opportunity dimensions."
    )
    market_gaps: list[MarketGap] = Field(
        default_factory=list,
        description="Underserved needs a new entrant could target.",
    )
    recommended_angle: str = Field(
        description="The single sharpest angle/positioning recommended for this idea."
    )
    risks: list[str] = Field(
        default_factory=list, description="Key risks or reasons this might not work."
    )


# --------------------------------------------------------------------------- #
# Final output
# --------------------------------------------------------------------------- #


class MarketBrief(BaseModel):
    """Agent 4 (Formatter) output: the final opportunity brief.

    Pure assembly of every prior agent's typed output plus run metadata. No LLM
    call produces this — if it ever needed one, something failed upstream.
    """

    idea: str = Field(description="The original app idea the user submitted.")
    scout: ScoutData = Field(description="Raw data collected by the Scout.")
    analyst: AnalystData = Field(description="Structured insights from the Analyst.")
    strategist: StrategistData = Field(
        description="Scoring and strategy from the Strategist."
    )
    generated_at: datetime = Field(description="When this brief was generated (UTC).")
    duration_seconds: float = Field(
        description="Total pipeline wall-clock time in seconds."
    )
