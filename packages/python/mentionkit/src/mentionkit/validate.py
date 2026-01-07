from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Protocol, runtime_checkable

from mentionkit.parse import MentionsResult, parse_mentions


@runtime_checkable
class MentionValidator(Protocol):
    """App-provided validator for mention IDs (e.g., tenant/account scoping).

    mentionkit is intentionally DB-agnostic. Your application should implement
    this interface to enforce authorization and existence constraints, e.g.:
    - IDs exist
    - IDs belong to the current tenant/account
    - current user is allowed to reference them
    """

    async def validate(self, mentions: MentionsResult) -> None: ...


async def parse_and_validate_mentions(
    page_context: Mapping[str, Any] | None,
    *,
    validator: MentionValidator | None = None,
    **kwargs,
) -> MentionsResult:
    """Parse mentions and optionally validate them via an app-provided validator.

    This is a convenience wrapper around `parse_mentions(...)` that lets apps
    enforce tenant/account scoping in one call.
    """

    mentions = parse_mentions(page_context, **kwargs)
    if validator is not None:
        await validator.validate(mentions)
    return mentions


__all__ = ["MentionValidator", "parse_and_validate_mentions"]
