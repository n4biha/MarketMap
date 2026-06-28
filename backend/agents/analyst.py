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


class _KeptCompetitors(BaseModel):
    names: list[str] = Field(
        default_factory=list,
        description="Names of the competitors that are plausibly in the same "
        "market space as the idea. Copy each kept name exactly as given.",
    )


# --------------------------------------------------------------------------- #
# RAG building blocks
# --------------------------------------------------------------------------- #


def _gather_documents(state: MarketMapState) -> list[str]:
    """Flatten all of Scout's raw text into a single document list.

    Every Scout text channel must be concatenated here — this is the only
    place data enters the RAG index, so a field left out of this list is
    invisible to every downstream query and to the final brief.
    """
    scout = state.get("scout_data")
    if scout is None:
        return []
    raw = (
        scout.web_results
        + scout.app_reviews
        + scout.play_reviews
        + scout.hn_posts
        + scout.producthunt_posts
    )
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


def _grounded(
    llm,
    schema,
    instruction: str,
    chunks: list[str],
    anchor_names: list[str] | None = None,
):
    """One schema-constrained Claude call, grounded in `chunks`.

    If `anchor_names` is provided, the grounding rule is relaxed: the model must
    produce an entry for any anchor that appears anywhere in the chunks (even
    briefly), using whatever evidence exists — instead of returning empty just
    because no single chunk is a clean match. Without anchors, the strict
    "use ONLY the excerpts" rule applies (pain points / market summary unchanged).
    """
    context = "\n\n---\n\n".join(chunks) if chunks else "(no relevant excerpts found)"
    if anchor_names:
        names = ", ".join(anchor_names)
        rule = (
            "Use the research excerpts below as evidence. These items were "
            f"confirmed to exist and are in scope: {names}. If one of them "
            "appears in ANY excerpt — even briefly or in passing — produce an "
            "entry for it using whatever evidence is available. Only omit an "
            "item if there is zero evidence for it across all excerpts. Do not "
            "invent items that are not in the excerpts or this list."
        )
    else:
        rule = (
            "Use ONLY the research excerpts below. Do not invent anything that is "
            "not supported by them. If the excerpts contain nothing relevant, "
            "return an empty result."
        )
    prompt = f"{instruction}\n\n{rule}\n\nResearch excerpts:\n{context}"
    return llm.with_structured_output(schema).invoke(prompt)


def _competitor_query_and_instruction(idea: str, scraped_app_names: list[str]) -> tuple[str, str]:
    """Build the retrieval query and grounding instruction for competitor
    extraction, anchored on the apps Scout actually scraped reviews for.

    Those apps are the real competitors — naming them in both the query and the
    instruction pulls their review chunks to the top and stops the model from
    free-associating to generic tools (Trello, Notion, ...)."""
    if scraped_app_names:
        names = ", ".join(scraped_app_names)
        query = f"reviews, strengths and weaknesses of these apps: {names}"
        instruction = (
            f"These apps were scraped for reviews and are the primary competitors "
            f"for '{idea}': {names}. Produce one competitor entry per app, grounding "
            f"its strengths, weaknesses and positioning in the review excerpts below. "
            f"Add another product only if the excerpts clearly describe it as a "
            f"competing app — do not list generic tools that merely appear in passing."
        )
    else:
        query = f"competitor products, alternatives and existing apps for {idea}"
        instruction = f"Identify the competitor products and alternatives relevant to '{idea}'."
    return query, instruction


def _relevant_competitors(
    idea: str, competitors: list[CompetitorInsight]
) -> list[CompetitorInsight]:
    """Use Claude to filter out genuinely off-topic competitors."""
    if not competitors:
        return competitors

    listing = "\n".join(
        f"- {c.name}: {c.positioning}" if c.positioning else f"- {c.name}"
        for c in competitors
    )
    prompt = (
        f"App idea: {idea}\n\n"
        f"Candidate competitors:\n{listing}\n\n"
        "Return only the ones that are plausibly in the same market space as the "
        "idea — products someone researching this idea would actually compare "
        "against. Drop anything clearly off-topic. For example, for 'a budget app "
        "for college students', PocketGuard, Mint, and YNAB are relevant; VERO, "
        "Genspark, and Cilantro are not. Copy kept names exactly."
    )

    try:
        kept_names = _llm().with_structured_output(_KeptCompetitors).invoke(prompt).names
    except Exception as exc:  # noqa: BLE001 — never block the pipeline on this
        logger.warning("Competitor relevance check failed, keeping all: %s", exc)
        return competitors

    if not kept_names:
        return competitors

    keep = {n.strip().lower() for n in kept_names}
    filtered = [c for c in competitors if c.name.strip().lower() in keep]
    return filtered or competitors


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

    # Query 2 — competitors (anchored on the apps Scout actually scraped)
    scout = state.get("scout_data")
    scraped_app_names = scout.scraped_app_names if scout else []
    comp_query, comp_instruction = _competitor_query_and_instruction(idea, scraped_app_names)
    comp_chunks = _retrieve(collection, comp_query)
    competitors = _grounded(
        llm, _Competitors, comp_instruction, comp_chunks, anchor_names=scraped_app_names
    ).items
    competitors = _relevant_competitors(idea, competitors)

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
