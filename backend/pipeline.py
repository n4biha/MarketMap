"""LangGraph state machine wiring the four MarketMap agents together.

Flow:

    START -> scout -> (conditional) -> analyst -> strategist -> formatter -> END
                            |
                            v  (source_count < 3)
                          error -> END

The conditional edge after Scout fails fast: if fewer than 3 sources were
collected, route to the terminal error node instead of producing garbage. All
other edges are linear. The error node logs and stops — it does not retry.
"""

from __future__ import annotations

import logging
import time

from langgraph.graph import END, START, StateGraph

from agents.analyst import run_analyst
from agents.formatter import run_formatter
from agents.scout import run_scout
from agents.strategist import run_strategist
from schemas.brief import MarketBrief
from schemas.state import MarketMapState

logger = logging.getLogger(__name__)

# Minimum sources Scout must collect for the pipeline to proceed.
MIN_SOURCES = 3


def run_error(state: MarketMapState) -> dict:
    """Terminal error node: log the failure and record it in state. No retry."""
    scout = state.get("scout_data")
    count = scout.source_count if scout else 0
    message = (
        f"Insufficient sources collected ({count} < {MIN_SOURCES}); "
        "aborting before analysis."
    )
    logger.error(message)
    return {"error": message}


def _route_after_scout(state: MarketMapState) -> str:
    """Conditional edge: enough signal -> analyst, otherwise -> error."""
    scout = state.get("scout_data")
    count = scout.source_count if scout else 0
    return "analyst" if count >= MIN_SOURCES else "error"


def _build_graph():
    """Construct and compile the LangGraph state machine."""
    builder = StateGraph(MarketMapState)

    builder.add_node("scout", run_scout)
    builder.add_node("analyst", run_analyst)
    builder.add_node("strategist", run_strategist)
    builder.add_node("formatter", run_formatter)
    builder.add_node("error", run_error)

    builder.add_edge(START, "scout")
    builder.add_conditional_edges(
        "scout",
        _route_after_scout,
        {"analyst": "analyst", "error": "error"},
    )
    builder.add_edge("analyst", "strategist")
    builder.add_edge("strategist", "formatter")
    builder.add_edge("formatter", END)
    builder.add_edge("error", END)

    return builder.compile()


# Compiled graph, ready to invoke.
graph = _build_graph()


def run_pipeline(idea: str) -> MarketBrief:
    """Run the full pipeline for an idea and return the final MarketBrief.

    Raises RuntimeError if the pipeline aborts (e.g. too few sources) or
    finishes without producing a brief.
    """
    initial_state: MarketMapState = {"idea": idea, "started_at": time.time()}
    final_state = graph.invoke(initial_state)

    if final_state.get("error"):
        raise RuntimeError(final_state["error"])

    brief = final_state.get("brief")
    if brief is None:
        raise RuntimeError("Pipeline finished without producing a MarketBrief.")
    return brief
