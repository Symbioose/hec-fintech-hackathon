"""API smoke tests — list / get endpoints for products, AMs, market views."""
from __future__ import annotations


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    payload = r.json()
    assert payload["status"] == "ok"
    assert payload["embedding_provider"] in {"mock", "gemini"}
    assert payload["db"] == "connected"


def test_list_products(client):
    r = client.get("/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) == 30
    assert products[0]["id"] == "P-1001"
    assert products[0]["product_type"] == "autocallable"
    # underlying is an array, confidence is optional
    assert isinstance(products[0]["underlying"], list)


def test_get_product(client):
    r = client.get("/products/P-1001")
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "P-1001"
    assert p["coupon"] == 0.062


def test_get_product_not_found(client):
    r = client.get("/products/P-NOPE")
    assert r.status_code == 404


def test_list_asset_managers(client):
    r = client.get("/asset-managers")
    assert r.status_code == 200
    ams = r.json()
    assert len(ams) == 6
    assert ams[0]["id"] == "AM-01"
    # camelCase preserved on the wire (matches the TS interface)
    assert "avatarColor" in ams[0]
    assert ams[0]["allowed_currencies"] == ["EUR", "CHF"]


def test_get_asset_manager(client):
    r = client.get("/asset-managers/AM-01")
    assert r.status_code == 200
    am = r.json()
    assert am["strategy"] == "defensive_income"
    assert am["requires_capital_protection"] is True


def test_list_market_views(client):
    r = client.get("/market-views")
    assert r.status_code == 200
    views = r.json()
    assert len(views) == 4
    assert {v["id"] for v in views} == {"MV-1", "MV-2", "MV-3", "MV-4"}
