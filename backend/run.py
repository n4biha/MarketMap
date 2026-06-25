"""CLI runner for local testing.

Usage:
    python run.py "a habit tracker for ADHD adults"

Runs the full pipeline and pretty-prints the resulting MarketBrief. Agent
progress is logged to the terminal at INFO level as the pipeline runs.
"""

from __future__ import annotations

import logging
import sys

from pipeline import run_pipeline
from schemas.brief import MarketBrief


def _print_brief(brief: MarketBrief) -> None:
    """Pretty-print a MarketBrief to stdout."""
    score = brief.strategist.opportunity_score
    line = "=" * 70

    print(f"\n{line}")
    print(f"MARKET BRIEF — {brief.idea}")
    print(line)

    print("\nOPPORTUNITY SCORE")
    print(f"  Overall:                   {score.overall}")
    print(f"  Market crowding:           {score.market_crowding}")
    print(f"  User pain intensity:       {score.user_pain_intensity}")
    print(f"  Differentiation potential: {score.differentiation_potential}")
    print(f"  Execution complexity:      {score.execution_complexity}")

    print("\nRECOMMENDED ANGLE")
    print(f"  {brief.strategist.recommended_angle}")

    print("\nMARKET GAPS")
    for gap in brief.strategist.market_gaps:
        print(f"  • {gap.description}")
        print(f"      ↳ {gap.rationale}")
    if not brief.strategist.market_gaps:
        print("  (none identified)")

    print("\nTOP PAIN POINTS")
    for pp in brief.analyst.pain_points:
        print(f"  • [{pp.severity}] {pp.description}")
    if not brief.analyst.pain_points:
        print("  (none found)")

    print("\nCOMPETITORS")
    for c in brief.analyst.competitors:
        print(f"  • {c.name}")
    if not brief.analyst.competitors:
        print("  (none found)")

    print("\nRISKS")
    for risk in brief.strategist.risks:
        print(f"  • {risk}")
    if not brief.strategist.risks:
        print("  (none noted)")

    print("\nMARKET SUMMARY")
    print(f"  {brief.analyst.market_summary or '(none)'}")

    print(f"\n{line}")
    print(
        f"Sources: {brief.scout.source_count}  |  "
        f"Generated: {brief.generated_at.isoformat()}  |  "
        f"Duration: {brief.duration_seconds}s"
    )
    print(f"{line}\n")


def main() -> None:
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print('Usage: python run.py "your app idea"')
        sys.exit(1)

    idea = " ".join(sys.argv[1:]).strip()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    try:
        brief = run_pipeline(idea)
    except RuntimeError as exc:
        print(f"\n❌ Pipeline failed: {exc}")
        sys.exit(1)

    _print_brief(brief)


if __name__ == "__main__":
    main()
