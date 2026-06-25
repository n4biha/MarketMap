"""Shared state for the MarketMap LangGraph pipeline.

`MarketMapState` is the single object passed between every node in the graph.
Each agent reads the previous agent's typed output from this state and writes
its own typed output back. Nodes return *partial* updates (only the keys they
changed); LangGraph merges them into the running state.

This is a ``TypedDict`` (LangGraph's required state-schema form), not a Pydantic
model. The values it holds, however, are the typed Pydantic models from
``schemas.brief``.
"""

from __future__ import annotations

from typing import TypedDict

# Imported at runtime (not just for type checking): LangGraph calls
# get_type_hints() on this TypedDict to build its state channels, which
# evaluates the annotation strings against this module's globals — so these
# names must be importable here. No circular import: schemas.brief imports
# nothing from this module.
from schemas.brief import AnalystData, MarketBrief, ScoutData, StrategistData


class MarketMapState(TypedDict, total=False):
    """The shared blackboard threaded through the LangGraph pipeline.

    ``total=False`` makes every key optional, so a node can return just the
    slice of state it produced (e.g. ``{"scout_data": ...}``).
    """

    # Input
    idea: str

    # Per-agent typed outputs, filled in as the pipeline progresses
    scout_data: ScoutData | None
    analyst_data: AnalystData | None
    strategist_data: StrategistData | None
    brief: MarketBrief | None

    # Pipeline metadata
    started_at: float  
    error: str | None 
