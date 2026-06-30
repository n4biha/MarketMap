"""FastAPI app exposing the MarketMap pipeline.

POST /research takes an app idea and returns the final MarketBrief as JSON.
(SSE streaming of agent status is a later milestone — Day 4 — not built here.)
"""

from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from pipeline import run_pipeline, stream_pipeline
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


@app.get("/research/stream")
def research_stream(idea: str) -> StreamingResponse:
    """Stream pipeline progress to the browser as Server-Sent Events.

    Emits one `data:` frame per agent as it completes ({"type":"node",...}),
    then a final frame with the full brief ({"type":"done",...}) or a failure
    ({"type":"error",...}). Consumed by the frontend via `EventSource`, which
    requires GET — so the idea comes in as a query param, not a JSON body.

    Declared as a sync `def`; Starlette iterates the sync generator in its
    threadpool, so the blocking LLM calls don't stall the event loop.
    """
    idea = idea.strip()
    if not idea:
        raise HTTPException(status_code=422, detail="idea must not be empty.")

    def event_stream() -> Iterator[str]:
        try:
            for evt in stream_pipeline(idea):
                yield f"data: {json.dumps(evt)}\n\n"
        except Exception as exc:  # surface any unexpected failure to the client
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        # Disable proxy/browser buffering so frames flush as each agent finishes.
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
