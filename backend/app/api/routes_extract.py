"""POST /extract — Gemini-powered structured product extraction.

Accepts raw bank email / Bloomberg chat / PDF text and returns a typed
ExtractedProductOut JSON with per-field confidence scores.

Falls back to HTTP 503 when no Gemini client was wired at startup (i.e., no
GOOGLE_API_KEY), so the frontend can degrade gracefully to client-side Gemini
or regex heuristics.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException, Request

from app.schemas.extract import ExtractedProductOut, RawTextIn

log = logging.getLogger(__name__)

router = APIRouter(prefix="/extract", tags=["extract"])

_EXTRACTION_SCHEMA = """{
  "issuer": "string — bank or issuer name (e.g. BNP Paribas SA)",
  "product_name": "string — full product name or null",
  "product_type": "one of: fixed_rate_note, floating_rate_note, autocallable, reverse_convertible, capital_protected_note, credit_linked_note, range_accrual, other",
  "currency": "ISO code: EUR, USD, GBP, CHF or null",
  "tenor_years": "number — duration in years (e.g. 1.9) or null",
  "coupon": "decimal — e.g. 0.03125 for 3.125% or null",
  "coupon_type": "one of: fixed, floating, memory, conditional, zero_coupon or null",
  "underlying": "array of strings — names of underlying assets/issuers",
  "underlying_type": "one of: credit, rates, equity_index, single_stock, multi_asset or null",
  "barrier": "decimal — e.g. 0.6 for 60% or null",
  "capital_protection": "boolean",
  "autocall": "boolean",
  "issuer_rating": "S&P rating: AAA, AA+, AA, AA-, A+, A, A-, BBB+, BBB, BBB-, BB+ or null",
  "risk_level": "one of: low, medium, medium_high, high or null",
  "notional": "number in EUR/USD (e.g. 1250000) or null",
  "maturity_date": "ISO date string YYYY-MM-DD or null",
  "confidence": "object mapping each field name to a 0-1 confidence score"
}"""


def _build_prompt(text: str) -> str:
    return (
        "You are a structured products analyst. Extract financial product terms "
        "from the following bank communication.\n\n"
        f"Return ONLY a valid JSON object matching this schema exactly:\n{_EXTRACTION_SCHEMA}\n\n"
        "Rules:\n"
        "- coupon must be a decimal fraction (3.125% → 0.03125)\n"
        "- barrier must be a decimal fraction (60% → 0.6)\n"
        "- If a field cannot be determined from the text, use null (or [] for arrays, false for booleans)\n"
        "- confidence: assign 0.9+ if explicitly stated, 0.5-0.8 if inferred, 0.2-0.4 if uncertain\n"
        "- Do NOT invent values not present in the text\n\n"
        f"Bank communication:\n---\n{text[:3000]}\n---"
    )


@router.post("", response_model=ExtractedProductOut)
async def extract_product(body: RawTextIn, request: Request) -> ExtractedProductOut:
    client = getattr(request.app.state, "gemini_client", None)
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini not configured — set GOOGLE_API_KEY to enable server-side extraction",
        )

    prompt = _build_prompt(body.text)
    try:
        from google.genai import types

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        raw = (getattr(response, "text", "") or "").strip()
        data = json.loads(raw)
        return ExtractedProductOut.model_validate(data)
    except json.JSONDecodeError as exc:
        log.warning("Gemini returned non-JSON for extraction: %s", exc)
        raise HTTPException(status_code=422, detail="Gemini returned unparseable JSON") from exc
    except Exception as exc:  # noqa: BLE001
        log.error("Gemini extraction failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc
