"""Recommendation endpoint smoke tests."""
from __future__ import annotations


def test_recommendations_for_product(client):
    r = client.post("/recommendations/product/P-1001")
    assert r.status_code == 200
    recs = r.json()
    # 6 AMs in seed → 6 recommendations
    assert len(recs) == 6
    # sorted descending by score
    scores = [rec["score"] for rec in recs]
    assert scores == sorted(scores, reverse=True)
    # each rec carries the expected shape
    top = recs[0]
    assert top["product_id"] == "P-1001"
    assert top["id"].startswith("R-AM-")
    assert top["id"].endswith("-P-1001")
    assert set(top["sub_scores"].keys()) == {
        "semantic", "constraints", "yield_fit", "exposure_fit", "market_fit"
    }
    assert isinstance(top["rationale"], list)
    assert all("kind" in b and "text" in b for b in top["rationale"])


def test_recommendations_for_asset_manager(client):
    r = client.post("/recommendations/asset-manager/AM-01")
    assert r.status_code == 200
    recs = r.json()
    assert len(recs) == 30
    assert all(rec["asset_manager_id"] == "AM-01" for rec in recs)
    scores = [rec["score"] for rec in recs]
    assert scores == sorted(scores, reverse=True)


def test_recommendations_for_unknown_product_returns_404(client):
    r = client.post("/recommendations/product/P-NOPE")
    assert r.status_code == 404


def test_recommendations_for_unknown_am_returns_404(client):
    r = client.post("/recommendations/asset-manager/AM-NOPE")
    assert r.status_code == 404
