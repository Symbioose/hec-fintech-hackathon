"""Pydantic schema for PurchaseHistoryItem — mirror of Lovable/src/types/purchaseHistory.ts."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

PurchaseAction = Literal[
    "bought",
    "rejected",
    "requested_termsheet",
    "watched",
    "approved",
]


class PurchaseHistoryItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_manager_id: str
    product_id: str
    action: PurchaseAction
    amount: float | None = None
    date: str
    reason: str | None = None
    feedback: str | None = None
