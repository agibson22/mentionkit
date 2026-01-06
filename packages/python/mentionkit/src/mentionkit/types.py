from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID


@dataclass(frozen=True, slots=True)
class Mention:
    """A structured reference to an entity mentioned by the user.

    - `type` is normalized/canonical (e.g. "meeting", not "event").
    - `id` is authoritative and should be validated server-side (format + tenant scope).
    - `label` is display-only and may be stale or attacker-controlled.
    """

    type: str
    id: UUID
    label: Optional[str] = None


