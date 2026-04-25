"""Golden-fixture parity test against the frontend's matchingMock.ts.

For every (product, AM) pair in the seed data (30 × 6 = 180), assert that the
backend produces the same `score`, `hard_fail`, `hard_fail_reasons`,
`sub_scores`, and `rationale` as the JS implementation. The fixture is
produced by `npx tsx scripts/golden_scores.ts`.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from app.core.explanation import build_rationale_bullets
from app.core.matching import passes_hard_constraints
from app.core.scoring import compute_final_score, compute_sub_scores
from app.schemas.asset_manager import AssetManagerProfileSchema
from app.schemas.product import ProductSchema

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "expected_scores.json"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_json(path: Path):
    with path.open() as f:
        return json.load(f)


@pytest.fixture(scope="module")
def fixture():
    if not FIXTURE_PATH.exists():
        pytest.skip(
            "Golden fixture missing — run `npx --yes tsx scripts/golden_scores.ts` from backend/"
        )
    return _load_json(FIXTURE_PATH)


@pytest.fixture(scope="module")
def products() -> dict[str, ProductSchema]:
    rows = _load_json(DATA_DIR / "sample_products.json")
    return {r["id"]: ProductSchema.model_validate(r) for r in rows}


@pytest.fixture(scope="module")
def asset_managers() -> dict[str, AssetManagerProfileSchema]:
    rows = _load_json(DATA_DIR / "sample_asset_managers.json")
    return {r["id"]: AssetManagerProfileSchema.model_validate(r) for r in rows}


def test_input_hash_matches(fixture, products, asset_managers):
    """Catch silent drift between fixture and current sample data.

    Uses ``separators=(",", ":")`` so the byte stream matches what JS's
    ``JSON.stringify`` emits (no whitespace between tokens).
    """
    expected = hashlib.sha256(
        json.dumps(
            {"products": sorted(products), "ams": sorted(asset_managers)},
            separators=(",", ":"),
        ).encode()
    ).hexdigest()
    assert fixture["input_hash"] == expected, (
        "Fixture is stale — regenerate with "
        "`npx --yes tsx scripts/golden_scores.ts` from backend/"
    )


def test_every_pair_matches_fixture(fixture, products, asset_managers):
    mismatches: list[str] = []
    for expected in fixture["results"]:
        product = products[expected["product_id"]]
        am = asset_managers[expected["asset_manager_id"]]

        passes, reasons = passes_hard_constraints(product, am)
        sub = compute_sub_scores(product, am)
        score = compute_final_score(sub, hard_fail=not passes)
        rationale = build_rationale_bullets(product, am, reasons)

        if score != expected["score"]:
            mismatches.append(
                f"{expected['id']}: score {score} != {expected['score']}"
            )
        if (not passes) != expected["hard_fail"]:
            mismatches.append(
                f"{expected['id']}: hard_fail {not passes} != {expected['hard_fail']}"
            )
        if list(reasons) != list(expected["hard_fail_reasons"]):
            mismatches.append(
                f"{expected['id']}: reasons {reasons} != {expected['hard_fail_reasons']}"
            )
        for key in ("semantic", "constraints", "yield_fit", "exposure_fit", "market_fit"):
            actual = getattr(sub, key)
            want = expected["sub_scores"][key]
            if actual != pytest.approx(want, rel=1e-9, abs=1e-12):
                mismatches.append(
                    f"{expected['id']}: sub.{key} {actual} != {want}"
                )
        actual_bullets = [(b.kind, b.text) for b in rationale]
        expected_bullets = [(b["kind"], b["text"]) for b in expected["rationale"]]
        if actual_bullets != expected_bullets:
            mismatches.append(
                f"{expected['id']}: rationale\n  got {actual_bullets}\n  exp {expected_bullets}"
            )

    if mismatches:
        head = "\n".join(mismatches[:30])
        more = f"\n... and {len(mismatches) - 30} more" if len(mismatches) > 30 else ""
        pytest.fail(f"{len(mismatches)} mismatches:\n{head}{more}")
