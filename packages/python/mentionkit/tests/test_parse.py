from __future__ import annotations

import pytest

from mentionkit import (
    MentionParseError,
    TooManyMentionsError,
    parse_and_validate_mentions,
    parse_mentions,
    summarize_mentions_for_prompt,
)


def test_parse_mentions_normalizes_and_dedupes() -> None:
    page_context = {
        "mentions": [
            {
                "type": "event",
                "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                "label": "Conference Room All Hands",
            },
            # Duplicate of the same mention should be deduped by default.
            {
                "type": "meeting",
                "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                "label": "Conference Room All Hands",
            },
        ]
    }

    mentions = parse_mentions(page_context, aliases={"event": "meeting"})
    items = mentions.get_all("meeting")
    assert len(items) == 1
    assert items[0].type == "meeting"
    assert str(items[0].id) == "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8"


def test_invalid_uuid_raises() -> None:
    page_context = {"mentions": [{"type": "contact", "id": "not-a-uuid", "label": "Dwight"}]}
    with pytest.raises(MentionParseError):
        parse_mentions(page_context)


def test_parse_mentions_supports_custom_id_parser() -> None:
    page_context = {"mentions": [{"type": "contact", "id": "obj_123", "label": "Dwight"}]}
    mentions = parse_mentions(page_context, id_parser=lambda v: str(v))
    item = mentions.get_first("contact")
    assert item is not None
    assert item.id == "obj_123"


def test_parse_mentions_custom_id_parser_dedupes_by_parsed_id() -> None:
    page_context = {
        "mentions": [
            {"type": "contact", "id": "obj_123", "label": "Dwight"},
            {"type": "contact", "id": "obj_123", "label": "Dwight (dup)"},
        ]
    }
    mentions = parse_mentions(page_context, id_parser=lambda v: str(v))
    items = mentions.get_all("contact")
    assert len(items) == 1
    assert items[0].id == "obj_123"


def test_ensure_at_most_one_raises_on_multiple() -> None:
    page_context = {
        "mentions": [
            {
                "type": "contact",
                "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                "label": "Dwight Schrute",
            },
            {
                "type": "contact",
                "id": "11111111-1111-4111-8111-111111111111",
                "label": "Jim Halpert",
            },
        ]
    }
    mentions = parse_mentions(page_context)
    with pytest.raises(TooManyMentionsError):
        _ = mentions.ensure_at_most_one("contact")


def test_prompt_summary_never_includes_ids() -> None:
    page_context = {
        "mentions": [
            {
                "type": "contact",
                "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                "label": "Dwight Schrute",
            }
        ]
    }
    mentions = parse_mentions(page_context)
    summary = summarize_mentions_for_prompt(mentions)
    assert summary is not None
    assert "Dwight Schrute" in summary
    assert "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8" not in summary


@pytest.mark.asyncio
async def test_parse_and_validate_mentions_calls_validator() -> None:
    class Validator:
        def __init__(self) -> None:
            self.called = False

        async def validate(self, mentions) -> None:  # type: ignore[no-untyped-def]
            self.called = True
            # sanity check: validator sees parsed mentions
            assert summarize_mentions_for_prompt(mentions) is not None

    v = Validator()
    page_context = {
        "mentions": [
            {
                "type": "contact",
                "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                "label": "Dwight Schrute",
            }
        ]
    }
    _ = await parse_and_validate_mentions(page_context, validator=v)
    assert v.called is True
