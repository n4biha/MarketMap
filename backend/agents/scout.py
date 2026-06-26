"""Agent 1 — Scout: data collection only, zero analysis.

Scout gathers raw signal about an app idea from several channels:
  1. Tavily web search — two queries (market landscape + user complaints)
  2. App Store reviews via app-store-web-scraper (names resolved to app ids
     through Apple's iTunes Search API)
  3. Google Play reviews via google-play-scraper (no key)
  4. Hacker News via the Algolia HN Search API (no auth)
  5. Product Hunt via its GraphQL API (bearer token) — competitor discovery

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
REVIEWS_PER_APP = 20
MAX_APPS_TO_SCRAPE = 4
PLAY_APPS_TO_SCRAPE = 4
PLAY_REVIEWS_PER_APP = 20
HN_STORIES = 5
HN_COMMENTS_PER_STORY = 3
PH_LIMIT = 5

# Only scrape reviews for apps in plausibly-relevant store categories, and only
# when the resolved app name reasonably matches the term we looked it up with.
ALLOWED_CATEGORIES = {
    "Productivity", "Health & Fitness", "Medical", "Lifestyle", "Education",
}
NAME_MATCH_THRESHOLD = 0.5

PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql"
PH_QUERY = """
query MarketMapSearch($n: Int!) {
  posts(order: VOTES, first: $n) {
    edges {
      node {
        name
        tagline
        description
        votesCount
      }
    }
  }
}
"""


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


def _name_matches(search_term: str, app_name: str) -> bool:
    """True if a resolved app name is a reasonable match for the term we
    searched with — guards against an unrelated popular app hijacking a loose
    query (e.g. 'Sup - Better Habits' resolving to a defunct app called 'Sup').

    Either a difflib ratio or a token-overlap fraction clearing
    NAME_MATCH_THRESHOLD counts as a match, so brand suffixes ('Habitica:
    Gamify Your Tasks') don't sink an otherwise-good hit. Token overlap uses
    substring containment so 'habit' matches 'habits'/'habitomic'."""
    import difflib
    import re

    a = search_term.lower().strip()
    b = app_name.lower().strip()
    if not a or not b:
        return False
    ratio = difflib.SequenceMatcher(None, a, b).ratio()
    tokens = set(re.findall(r"[a-z0-9]+", a))
    overlap = sum(1 for t in tokens if t in b) / len(tokens) if tokens else 0.0
    return ratio >= NAME_MATCH_THRESHOLD or overlap >= NAME_MATCH_THRESHOLD


def _lookup_app(name: str) -> tuple[int, str] | None:
    """Resolve an app name to its (App Store id, canonical name) via Apple's
    free iTunes Search API (no key required).

    Returns None when nothing matches, when the app's primaryGenreName is
    outside ALLOWED_CATEGORIES, or when the canonical name isn't a reasonable
    match for the search term — so a loose query can't pull in an unrelated
    app."""
    import requests

    resp = requests.get(
        "https://itunes.apple.com/search",
        params={"term": name, "entity": "software", "limit": 1},
        timeout=10,
    )
    results = resp.json().get("results", [])
    if not results:
        return None

    top = results[0]
    track_id = top.get("trackId")
    if not track_id:
        return None
    track_name = (top.get("trackName") or name).strip()
    genre = top.get("primaryGenreName")
    if genre not in ALLOWED_CATEGORIES:
        logger.info("Skipping %r — App Store category %r not in allowed set", track_name, genre)
        return None
    if not _name_matches(name, track_name):
        logger.info("Skipping %r — weak name match for search term %r", track_name, name)
        return None
    return track_id, track_name


def _collect_app_reviews(competitor_names: list[str]) -> tuple[list[str], list[str]]:
    """Fetch App Store reviews for the first few discovered competitor names.

    The scraper takes a numeric app id, so each name is first resolved via the
    iTunes Search API — which also gives the app's canonical name. Returns
    ``(reviews, scraped_names)``, where scraped_names holds the real names of
    the apps we actually pulled reviews for (higher-signal competitors than raw
    web/PH titles). Best-effort and flaky, so every app is guarded
    independently and any failure is skipped."""
    reviews: list[str] = []
    scraped_names: list[str] = []
    if not competitor_names:
        return reviews, scraped_names
    try:
        from app_store_web_scraper import AppStoreEntry
    except Exception as exc:  # noqa: BLE001 — library missing/unavailable
        logger.warning("app-store-web-scraper unavailable, skipping reviews: %s", exc)
        return reviews, scraped_names

    for name in competitor_names[:MAX_APPS_TO_SCRAPE]:
        try:
            resolved = _lookup_app(name)
            if not resolved:
                logger.info("No App Store match for %r; skipping", name)
                continue
            app_id, app_name = resolved
            entry = AppStoreEntry(app_id=app_id, country="us")
            got_review = False
            for review in entry.reviews(limit=REVIEWS_PER_APP):
                body = (review.content or "").strip()
                if body:
                    reviews.append(body)
                    got_review = True
            if got_review:
                scraped_names.append(app_name)
        except Exception as exc:  # noqa: BLE001 — skip this app, keep going
            logger.warning("App Store review fetch failed for %r: %s", name, exc)
            continue

    if not scraped_names:
        logger.info("App Store: no candidate apps passed category/name filters")
    return reviews, scraped_names


def _dedupe_names(names: list[str]) -> list[str]:
    """Order-preserving, case-insensitive dedupe — the first occurrence of each
    name wins, so higher-priority (earlier) names are kept."""
    seen: set[str] = set()
    out: list[str] = []
    for name in names:
        key = name.lower().strip()
        if key and key not in seen:
            seen.add(key)
            out.append(name)
    return out


def _collect_play_reviews(idea: str) -> tuple[list[str], list[str]]:
    """Fetch recent Google Play reviews for the top apps matching the idea.

    Uses google-play-scraper (no API key): searches Play for matching apps,
    takes the top few, and pulls their most recent reviews. Returns
    ``(reviews, scraped_names)``, where scraped_names holds the titles of the
    apps we actually pulled reviews for. Best-effort — the whole thing degrades
    to ([], []) and each app is guarded independently."""
    out: list[str] = []
    scraped_names: list[str] = []
    try:
        from google_play_scraper import Sort, reviews, search
    except Exception as exc:  # noqa: BLE001 — library missing/unavailable
        logger.warning("google-play-scraper unavailable, skipping Play reviews: %s", exc)
        return out, scraped_names

    try:
        apps = search(idea, n_hits=PLAY_APPS_TO_SCRAPE, lang="en", country="us")
    except Exception as exc:  # noqa: BLE001 — search failed; nothing to scrape
        logger.warning("Google Play search failed, continuing without Play data: %s", exc)
        return out, scraped_names

    for app in apps[:PLAY_APPS_TO_SCRAPE]:
        app_id = app.get("appId")
        if not app_id:
            continue
        genre = app.get("genre")
        if genre not in ALLOWED_CATEGORIES:
            logger.info("Skipping Play app %r — category %r not in allowed set", app.get("title"), genre)
            continue
        try:
            result, _ = reviews(
                app_id,
                lang="en",
                country="us",
                sort=Sort.NEWEST,
                count=PLAY_REVIEWS_PER_APP,
            )
            got_review = False
            for review in result:
                body = (review.get("content") or "").strip()
                if body:
                    out.append(body)
                    got_review = True
            if got_review:
                title = (app.get("title") or "").strip()
                if title:
                    scraped_names.append(title)
        except Exception as exc:  # noqa: BLE001 — skip this app, keep going
            logger.warning("Google Play review fetch failed for %r: %s", app_id, exc)
            continue

    if not scraped_names:
        logger.info("Google Play: no apps passed the category filter")
    return out, scraped_names


_HN_STOPWORDS = {
    "a", "an", "the", "for", "of", "to", "with", "and", "or", "in", "on",
    "app", "apps", "application", "tool", "tools", "adult", "adults",
    "people", "user", "users",
}


def _core_keywords(idea: str, max_words: int = 3) -> str:
    """Reduce a verbose idea to a few core search keywords.

    Algolia's HN search requires every term to match, so the full idea string
    ("a habit tracker for ADHD adults") returns nothing. Dropping filler words
    and capping the count ("habit tracker ADHD") restores hits. Falls back to
    the original idea if filtering removes everything."""
    words = [w for w in idea.split() if w.lower().strip(".,!?") not in _HN_STOPWORDS]
    return " ".join(words[:max_words]) or idea


def _strip_html(text: str) -> str:
    """Crude HTML-tag/entity cleanup for HN comment bodies."""
    import html
    import re

    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(text).strip()


def _collect_hn(idea: str) -> list[str]:
    """Search Hacker News via the Algolia HN Search API (no auth) for stories
    about the idea, returning each top story's title plus its top comments.
    Plain HTTP GET; degrades gracefully to []."""
    posts: list[str] = []
    try:
        import requests

        resp = requests.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": _core_keywords(idea), "tags": "story"},
            timeout=10,
        )
        hits = resp.json().get("hits", [])[:HN_STORIES]
    except Exception as exc:  # noqa: BLE001 — HN is optional; never crash
        logger.warning("Hacker News search failed, continuing without HN data: %s", exc)
        return posts

    for hit in hits:
        title = (hit.get("title") or "").strip()
        object_id = hit.get("objectID")
        if title:
            posts.append(title)
        if not object_id:
            continue
        try:
            item = requests.get(
                f"https://hn.algolia.com/api/v1/items/{object_id}", timeout=10
            ).json()
            for child in (item.get("children") or [])[:HN_COMMENTS_PER_STORY]:
                comment = _strip_html(child.get("text") or "")
                if comment:
                    posts.append(comment)
        except Exception as exc:  # noqa: BLE001 — skip this story's comments
            logger.warning("HN comment fetch failed for story %s: %s", object_id, exc)
            continue

    return posts


def _collect_producthunt(idea: str) -> tuple[list[str], list[str]]:
    """Query the Product Hunt GraphQL API (bearer token in PRODUCTHUNT_TOKEN),
    primarily for competitor discovery.

    The v2 API has no free-text post search, so we pull the top-voted posts and
    keep those whose name/tagline/description mentions the idea's keywords
    (falling back to all fetched posts if none match). Returns
    ``(producthunt_posts, discovered_names)`` — the caller appends the names to
    competitor_names. Degrades gracefully to ([], [])."""
    posts: list[str] = []
    names: list[str] = []

    token = os.getenv("PRODUCTHUNT_TOKEN")
    if not token:
        logger.warning("PRODUCTHUNT_TOKEN not set, skipping Product Hunt")
        return posts, names

    try:
        import requests

        resp = requests.post(
            PH_ENDPOINT,
            json={"query": PH_QUERY, "variables": {"n": PH_LIMIT}},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        edges = resp.json().get("data", {}).get("posts", {}).get("edges", [])
    except Exception as exc:  # noqa: BLE001 — PH is optional; never crash
        logger.warning("Product Hunt query failed, continuing without PH data: %s", exc)
        return posts, names

    keywords = [w.lower() for w in idea.split() if len(w) > 3]
    matched: list[dict] = []
    for edge in edges:
        node = edge.get("node") or {}
        haystack = " ".join(
            str(node.get(k) or "") for k in ("name", "tagline", "description")
        ).lower()
        if not keywords or any(kw in haystack for kw in keywords):
            matched.append(node)
    if not matched:
        matched = [edge.get("node") or {} for edge in edges]

    for node in matched:
        name = (node.get("name") or "").strip()
        tagline = (node.get("tagline") or "").strip()
        description = (node.get("description") or "").strip()
        votes = node.get("votesCount")
        if name:
            names.append(name)
        text = f"{name} — {tagline}\n{description}\n({votes} upvotes)".strip()
        if text:
            posts.append(text)

    return posts, names


def run_scout(state: MarketMapState) -> dict:
    """LangGraph node for Agent 1.

    Collects raw data from every channel and writes a ``ScoutData`` to state.
    Does NOT decide whether there's enough signal — the pipeline's conditional
    edge inspects ``source_count`` for that.
    """
    idea = state["idea"]
    logger.info("Scout starting collection for idea: %s", idea)

    # Web first, then Product Hunt — so App Store scraping below covers
    # competitors discovered from BOTH sources, not just web.
    web_results, competitor_names = _collect_web(idea)
    ph_posts, ph_names = _collect_producthunt(idea)

    # Google Play discovery first: its search returns real app names (Habitica,
    # Habitify, Loop Habit Tracker, ...). Those — plus Product Hunt product
    # names — are good App Store search terms: they resolve correctly and clear
    # the category + name-similarity filters. Raw web-search titles do not, so we
    # deliberately feed app/product names to the App Store lookup, not the web
    # `competitor_names`.
    play_reviews, play_names = _collect_play_reviews(idea)
    appstore_candidates = _dedupe_names(play_names + ph_names)
    app_reviews, appstore_names = _collect_app_reviews(appstore_candidates)
    hn_posts = _collect_hn(idea)

    # Apps we actually scraped reviews from are the strongest competitor signal —
    # promote their real names ahead of PH product names and web-search titles.
    scraped_app_names = _dedupe_names(appstore_names + play_names)
    competitor_names = _dedupe_names(scraped_app_names + ph_names + competitor_names)

    source_count = (
        len(web_results)
        + len(app_reviews)
        + len(play_reviews)
        + len(hn_posts)
        + len(ph_posts)
    )
    logger.info(
        "Scout collected %d sources (web=%d, reviews=%d, play=%d, hn=%d, ph=%d)",
        source_count,
        len(web_results),
        len(app_reviews),
        len(play_reviews),
        len(hn_posts),
        len(ph_posts),
    )

    scout_data = ScoutData(
        web_results=web_results,
        app_reviews=app_reviews,
        play_reviews=play_reviews,
        hn_posts=hn_posts,
        producthunt_posts=ph_posts,
        competitor_names=competitor_names,
        scraped_app_names=scraped_app_names,
        source_count=source_count,
    )
    return {"scout_data": scout_data}
