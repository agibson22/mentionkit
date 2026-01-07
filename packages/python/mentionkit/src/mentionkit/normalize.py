"""Mention type normalization utilities.

Mention types are part of the wire contract, but different clients/apps may use
different strings for the same concept (e.g. "event" vs "meeting").

This module provides a small normalization helper that supports:
- lowercasing/trim
- optional aliasing via a caller-provided mapping
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Final

DEFAULT_TYPE_ALIASES: Final[Mapping[str, str]] = {
    # Common alias seen in calendar/event integrations.
    "event": "meeting",
}


def normalize_mention_type(raw_type: str, *, aliases: Mapping[str, str] | None = None) -> str:
    """Normalize a mention type using aliases.

    - Always trims and lowercases.
    - Applies aliases if provided (or DEFAULT_TYPE_ALIASES if not).
    - Unknown types are returned as-is so callers can raise a clear error upstream.
    """

    key = (raw_type or "").strip().lower()
    mapping = aliases if aliases is not None else DEFAULT_TYPE_ALIASES
    return mapping.get(key, key)
