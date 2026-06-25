"""Agent 4 — Formatter: assemble the final brief. NO LLM call.

This agent does pure data assembly from the three previous agents' typed
outputs plus run metadata. It imports nothing from langchain/anthropic by
design — if the Formatter ever needed an LLM, something went wrong upstream.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from schemas.brief import AnalystData, MarketBrief, ScoutData
from schemas.state import MarketMapState

logger = logging.getLogger(__name__)


def run_formatter(state: MarketMapState) -> dict:
    """LangGraph node for Agent 4.

    Combines ScoutData + AnalystData + StrategistData and run metadata into the
    final MarketBrief. Zero AI calls.
    """
    idea = state["idea"]
    scout = state.get("scout_data") or ScoutData()
    analyst = state.get("analyst_data") or AnalystData()
    strategist = state.get("strategist_data")

    # The Formatter only runs on the happy path (the error node bypasses it), so
    # a missing StrategistData means an upstream agent failed — surface it loudly
    # rather than emit a hollow brief.
    if strategist is None:
        raise ValueError(
            "Formatter reached without StrategistData — upstream pipeline failure."
        )

    started_at = state.get("started_at")
    duration_seconds = (time.time() - started_at) if started_at else 0.0

    brief = MarketBrief(
        idea=idea,
        scout=scout,
        analyst=analyst,
        strategist=strategist,
        generated_at=datetime.now(timezone.utc),
        duration_seconds=round(duration_seconds, 2),
    )
    logger.info("Formatter assembled MarketBrief in %.2fs", duration_seconds)
    return {"brief": brief}
