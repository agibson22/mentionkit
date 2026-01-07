from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, Generic, Iterable, List, Mapping, Optional, Set
from uuid import UUID

from mentionkit.normalize import normalize_mention_type
from mentionkit.types import IdT, Mention


class MentionParseError(ValueError):
    """Raised when a mention payload cannot be parsed safely."""


class TooManyMentionsError(ValueError):
    """Raised when a single-mention selector encounters multiple mentions."""


def _parse_uuid(raw_id: Any) -> UUID:
    if isinstance(raw_id, UUID):
        return raw_id
    return UUID(str(raw_id))


@dataclass
class MentionsResult(Generic[IdT]):
    """Grouped mentions with convenience selectors."""

    by_type: Dict[str, List[Mention[IdT]]]

    def get_all(self, mention_type: str, *, aliases: Optional[Mapping[str, str]] = None) -> List[Mention[IdT]]:
        key = normalize_mention_type(mention_type, aliases=aliases)
        return list(self.by_type.get(key, []))

    def get_first(self, mention_type: str, *, aliases: Optional[Mapping[str, str]] = None) -> Optional[Mention[IdT]]:
        matches = self.get_all(mention_type, aliases=aliases)
        return matches[0] if matches else None

    def ensure_at_most_one(
        self,
        mention_type: str,
        *,
        aliases: Optional[Mapping[str, str]] = None,
    ) -> Optional[Mention[IdT]]:
        matches = self.get_all(mention_type, aliases=aliases)
        if len(matches) > 1:
            raise TooManyMentionsError(f"Multiple '{mention_type}' mentions provided; disambiguation required.")
        return matches[0] if matches else None


def parse_mentions(
    page_context: Optional[Mapping[str, Any]],
    *,
    aliases: Optional[Mapping[str, str]] = None,
    allowed_types: Optional[Iterable[str]] = None,
    dedupe: bool = True,
    id_parser: Optional[Callable[[Any], IdT]] = None,
) -> MentionsResult[IdT]:
    """Parse, normalize, and group mentions from a `page_context` mapping.

    This function:
    - Reads `page_context["mentions"]` (list of dicts)
    - Normalizes `type` via `normalize_mention_type` (optionally with custom aliases)
    - Parses `id` via `id_parser` (defaults to UUID parsing)
    - Optionally filters to `allowed_types`
    - Optionally dedupes by `(type, id)` while preserving first occurrence order
    """

    parser: Callable[[Any], IdT]
    if id_parser is None:
        parser = _parse_uuid  # type: ignore[assignment]
    else:
        parser = id_parser

    raw_mentions: Any = None
    if isinstance(page_context, Mapping):
        raw_mentions = page_context.get("mentions")

    if not isinstance(raw_mentions, list):
        return MentionsResult(by_type={})

    allowed: Optional[Set[str]] = None
    if allowed_types is not None:
        allowed = {normalize_mention_type(t, aliases=aliases) for t in allowed_types}

    grouped: Dict[str, List[Mention[IdT]]] = {}
    seen: Dict[str, Set[IdT]] = {}

    for m in raw_mentions:
        if not isinstance(m, Mapping):
            continue

        raw_type = m.get("type")
        raw_id = m.get("id")
        raw_label = m.get("label")

        norm_type = normalize_mention_type(str(raw_type or ""), aliases=aliases)
        if not norm_type:
            continue

        if allowed is not None and norm_type not in allowed:
            continue

        if raw_id is None:
            raise MentionParseError("Invalid mention id format.")
        if isinstance(raw_id, str) and not raw_id.strip():
            raise MentionParseError("Invalid mention id format.")

        try:
            parsed_id = parser(raw_id)
        except Exception as e:
            raise MentionParseError("Invalid mention id format.") from e

        if dedupe:
            seen.setdefault(norm_type, set())
            if parsed_id in seen[norm_type]:
                continue
            seen[norm_type].add(parsed_id)

        label = None if raw_label is None else str(raw_label)
        grouped.setdefault(norm_type, []).append(Mention(type=norm_type, id=parsed_id, label=label))

    # Remove empty types (if any)
    grouped = {t: items for t, items in grouped.items() if items}
    return MentionsResult(by_type=grouped)


__all__ = ["MentionParseError", "TooManyMentionsError", "MentionsResult", "parse_mentions"]


