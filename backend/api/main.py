"""FastAPI app exposing the MarketMap pipeline.

POST /research takes an app idea and returns the final MarketBrief as JSON.
(SSE streaming of agent status is a later milestone — Day 4 — not built here.)
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline import run_pipeline
from schemas.brief import MarketBrief

app = FastAPI(
    title="MarketMap",
    description="AI market-research agent: 4 agents turn an app idea into an opportunity brief.",
    version="0.1.0",
)

# Allow the Next.js dev frontend to call the API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    """Request body for POST /research."""

    idea: str = Field(..., min_length=1, description="The app idea to research.")


@app.get("/health")
def health() -> dict:
    """Liveness check."""
    return {"status": "ok"}


@app.post("/research", response_model=MarketBrief)
def research(request: ResearchRequest) -> MarketBrief:
    """Run the full pipeline for an idea and return the MarketBrief.

    Defined as a sync `def` (not `async`) so FastAPI runs the blocking
    pipeline in its threadpool rather than stalling the event loop.
    """
    try:
        return run_pipeline(request.idea)
    except RuntimeError as exc:
        # Domain failure (e.g. too few sources) -> 422 Unprocessable Entity.
        raise HTTPException(status_code=422, detail=str(exc))
