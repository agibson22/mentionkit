from __future__ import annotations

from collections.abc import Hashable
from dataclasses import dataclass
from typing import Generic, TypeVar

IdT = TypeVar("IdT", bound=Hashable)


@dataclass(frozen=True, slots=True)
class Mention(Generic[IdT]):
    """A structured reference to an entity mentioned by the user.

    - `type` is normalized/canonical (e.g. "meeting", not "event").
    - `id` is authoritative and should be validated server-side (format + tenant scope).
    - `label` is display-only and may be stale or attacker-controlled.
    """

    type: str
    id: IdT
    label: str | None = None
