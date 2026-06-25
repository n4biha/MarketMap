"""Agent 1 — Scout: data collection only, zero analysis.

Scout gathers raw signal about an app idea from three channels:
  1. Tavily web search — two queries (market landscape + user complaints)
  2. Reddit via PRAW
  3. App Store reviews via app-store-web-scraper (names resolved to app ids
     through Apple's iTunes Search API)

It performs NO analysis and makes NO LLM call — it only collects text and
hands it to the Analyst. Every collector is wrapped so a failing or
unavailable source degrades to an empty list instead of crashing the pipeline.
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

from schemas.brief import ScoutData
from schemas.state import MarketMapState

load_dotenv()
logger = logging.getLogger(__name__)

# How much to pull from each source. Kept modest to stay fast and within limits.
WEB_RESULTS_PER_QUERY = 5
REDDIT_LIMIT = 15
REVIEWS_PER_APP = 20
MAX_APPS_TO_SCRAPE = 2


def _collect_web(idea: str) -> tuple[list[str], list[str]]:
    """Run Scout's two Tavily searches.

    Returns ``(web_results, competitor_names)``:
      - web_results: snippet text from both the market-landscape and
        user-complaints queries.
      - competitor_names: result titles from the market-landscape query, used
        as competitor candidates (pure collection — no interpretation).
    """
    web_results: list[str] = []
    competitor_names: list[str] = []
    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

        landscape_query = f"{idea} apps competitors alternatives"
        complaints_query = f"{idea} problems complaints frustrations user reviews"

        landscape = client.search(query=landscape_query, max_results=WEB_RESULTS_PER_QUERY)
        for result in landscape.get("results", []):
            content = (result.get("content") or "").strip()
            if content:
                web_results.append(content)
            title = (result.get("title") or "").strip()
            if title:
                competitor_names.append(title)

        complaints = client.search(query=complaints_query, max_results=WEB_RESULTS_PER_QUERY)
        for result in complaints.get("results", []):
            content = (result.get("content") or "").strip()
            if content:
                web_results.append(content)
    except Exception as exc:  # noqa: BLE001 — any failure must degrade, not crash
        logger.warning("Tavily web search failed, continuing without web data: %s", exc)

    return web_results, competitor_names


def _collect_reddit(idea: str) -> list[str]:
    """Search Reddit for posts about the idea. Degrades gracefully to [] if
    Reddit is unavailable or credentials are missing."""
    posts: list[str] = []
    try:
        import praw

        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent=os.getenv("REDDIT_USER_AGENT", "MarketMap/1.0"),
        )
        for submission in reddit.subreddit("all").search(idea, limit=REDDIT_LIMIT):
            text = f"{submission.title}\n{submission.selftext or ''}".strip()
            if text:
                posts.append(text)
    except Exception as exc:  # noqa: BLE001 — Reddit is optional; never crash
        logger.warning("Reddit collection failed, continuing without Reddit data: %s", exc)

    return posts


def _lookup_app_id(name: str) -> int | None:
    """Resolve an app name to its App Store id via Apple's free iTunes Search
    API (no key required). Returns None if nothing matches."""
    import requests

    resp = requests.get(
        "https://itunes.apple.com/search",
        params={"term": name, "entity": "software", "limit": 1},
        timeout=10,
    )
    results = resp.json().get("results", [])
    return results[0].get("trackId") if results else None


def _collect_app_reviews(competitor_names: list[str]) -> list[str]:
    """Fetch App Store reviews for the first few discovered competitor names.

    The scraper takes a numeric app id, so each name is first resolved via the
    iTunes Search API. Best-effort and flaky, so every app is guarded
    independently and any failure is skipped."""
    reviews: list[str] = []
    if not competitor_names:
        return reviews
    try:
        from app_store_web_scraper import AppStoreEntry
    except Exception as exc:  # noqa: BLE001 — library missing/unavailable
        logger.warning("app-store-web-scraper unavailable, skipping reviews: %s", exc)
        return reviews

    for name in competitor_names[:MAX_APPS_TO_SCRAPE]:
        try:
            app_id = _lookup_app_id(name)
            if not app_id:
                logger.info("No App Store match for %r; skipping", name)
                continue
            entry = AppStoreEntry(app_id=app_id, country="us")
            for review in entry.reviews(limit=REVIEWS_PER_APP):
                body = (review.content or "").strip()
                if body:
                    reviews.append(body)
        except Exception as exc:  # noqa: BLE001 — skip this app, keep going
            logger.warning("App Store review fetch failed for %r: %s", name, exc)
            continue

    return reviews


def run_scout(state: MarketMapState) -> dict:
    """LangGraph node for Agent 1.

    Collects raw data from all three channels and writes a ``ScoutData`` to
    state. Does NOT decide whether there's enough signal — the pipeline's
    conditional edge inspects ``source_count`` for that.
    """
    idea = state["idea"]
    logger.info("Scout starting collection for idea: %s", idea)

    web_results, competitor_names = _collect_web(idea)
    reddit_posts = _collect_reddit(idea)
    app_reviews = _collect_app_reviews(competitor_names)

    source_count = len(web_results) + len(reddit_posts) + len(app_reviews)
    logger.info(
        "Scout collected %d sources (web=%d, reddit=%d, reviews=%d)",
        source_count,
        len(web_results),
        len(reddit_posts),
        len(app_reviews),
    )

    scout_data = ScoutData(
        web_results=web_results,
        reddit_posts=reddit_posts,
        app_reviews=app_reviews,
        competitor_names=competitor_names,
        source_count=source_count,
    )
    return {"scout_data": scout_data}
