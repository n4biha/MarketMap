"""Agent 2 — Analyst: a RAG pipeline over Scout's raw data.

Pipeline:
  1. Gather all raw text Scout collected.
  2. Chunk it with a recursive character splitter.
  3. Embed + store the chunks in ChromaDB (PersistentClient, default
     all-MiniLM-L6-v2 embeddings — cached to disk).
  4. Run three targeted RAG queries. Each is its OWN schema-constrained Claude
     call, grounded only in the chunks retrieved for that query:
        - pain points     -> list[UserPainPoint]
        - competitors     -> list[CompetitorInsight]
        - market summary  -> str
  5. Assemble the three results into an AnalystData.

Claude is constrained to the retrieved excerpts on every call — it never goes
off-memory or invents data.
"""

from __future__ import annotations

import hashlib
import logging
import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from schemas.brief import AnalystData, CompetitorInsight, UserPainPoint
from schemas.state import MarketMapState

load_dotenv()
logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-8"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
RETRIEVAL_K = 6
MAX_TOKENS = 2000


# --------------------------------------------------------------------------- #
# Private wrapper schemas — internal to the Analyst.
# LangChain's .with_structured_output() binds a model, so to get a bare list
# back we wrap it in a one-field model and unwrap `.items`.
# --------------------------------------------------------------------------- #


class _PainPoints(BaseModel):
    items: list[UserPainPoint] = Field(default_factory=list)


class _Competitors(BaseModel):
    items: list[CompetitorInsight] = Field(default_factory=list)


class _MarketSummary(BaseModel):
    summary: str = Field(default="", description="Grounded market landscape summary.")


# --------------------------------------------------------------------------- #
# RAG building blocks
# --------------------------------------------------------------------------- #


def _gather_documents(state: MarketMapState) -> list[str]:
    """Flatten all of Scout's raw text into a single document list."""
    scout = state.get("scout_data")
    if scout is None:
        return []
    raw = scout.web_results + scout.reddit_posts + scout.app_reviews
    return [text for text in raw if text and text.strip()]


def _collection_name(idea: str) -> str:
    """A stable, valid Chroma collection name unique to this idea.

    Same idea -> same collection (reuse cached embeddings on disk).
    Different idea -> different collection (no cross-idea contamination).
    """
    digest = hashlib.sha1(idea.encode("utf-8")).hexdigest()[:16]
    return f"mm_{digest}"


def _build_collection(idea: str, documents: list[str]):
    """Chunk the documents and upsert them into a per-idea Chroma collection.

    Returns the collection, or None if there is nothing to index.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    chunks: list[str] = []
    for doc in documents:
        chunks.extend(splitter.split_text(doc))
    chunks = [c for c in chunks if c.strip()]
    if not chunks:
        return None

    import chromadb

    persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    client = chromadb.PersistentClient(path=persist_dir)
    collection = client.get_or_create_collection(name=_collection_name(idea))

    # Content-hash IDs make re-indexing identical chunks idempotent (no
    # re-embedding) and dedupe duplicates within this run.
    by_id: dict[str, str] = {
        hashlib.sha1(chunk.encode("utf-8")).hexdigest(): chunk for chunk in chunks
    }
    collection.upsert(ids=list(by_id), documents=list(by_id.values()))
    logger.info("Analyst indexed %d unique chunks into Chroma", len(by_id))
    return collection


def _retrieve(collection, query: str, k: int = RETRIEVAL_K) -> list[str]:
    """Return the top-k chunk texts most relevant to a query."""
    result = collection.query(query_texts=[query], n_results=k)
    documents = result.get("documents") or [[]]
    return documents[0] if documents else []


def _llm():
    """Lazily construct the ChatAnthropic client (no temperature — removed on
    Opus 4.8)."""
    from langchain_anthropic import ChatAnthropic

    return ChatAnthropic(model=MODEL, max_tokens=MAX_TOKENS)


def _grounded(llm, schema, instruction: str, chunks: list[str]):
    """One schema-constrained Claude call, grounded only in `chunks`."""
    context = "\n\n---\n\n".join(chunks) if chunks else "(no relevant excerpts found)"
    prompt = (
        f"{instruction}\n\n"
        "Use ONLY the research excerpts below. Do not invent anything that is "
        "not supported by them. If the excerpts contain nothing relevant, "
        "return an empty result.\n\n"
        f"Research excerpts:\n{context}"
    )
    return llm.with_structured_output(schema).invoke(prompt)


# --------------------------------------------------------------------------- #
# Node
# --------------------------------------------------------------------------- #


def run_analyst(state: MarketMapState) -> dict:
    """LangGraph node for Agent 2.

    Builds the vector store from Scout's data, runs three grounded RAG queries,
    and writes an AnalystData to state.
    """
    idea = state["idea"]
    documents = _gather_documents(state)
    logger.info("Analyst starting RAG over %d documents", len(documents))

    collection = _build_collection(idea, documents)
    if collection is None:
        logger.warning("Analyst has no data to analyze; returning empty AnalystData")
        return {"analyst_data": AnalystData()}

    llm = _llm()

    # Query 1 — pain points
    pain_chunks = _retrieve(collection, f"user complaints, frustrations and pain points with {idea}")
    pain_points = _grounded(
        llm,
        _PainPoints,
        f"Extract the distinct user pain points related to '{idea}'.",
        pain_chunks,
    ).items

    # Query 2 — competitors
    comp_chunks = _retrieve(collection, f"competitor products, alternatives and existing apps for {idea}")
    competitors = _grounded(
        llm,
        _Competitors,
        f"Identify the competitor products and alternatives relevant to '{idea}'.",
        comp_chunks,
    ).items

    # Query 3 — market summary
    summary_chunks = _retrieve(collection, f"{idea} market overview, trends and landscape")
    market_summary = _grounded(
        llm,
        _MarketSummary,
        f"Write a concise, grounded summary of the market landscape for '{idea}'.",
        summary_chunks,
    ).summary

    logger.info(
        "Analyst extracted %d pain points and %d competitors",
        len(pain_points),
        len(competitors),
    )

    analyst_data = AnalystData(
        pain_points=pain_points,
        competitors=competitors,
        market_summary=market_summary,
    )
    return {"analyst_data": analyst_data}
