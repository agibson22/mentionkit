from __future__ import annotations

import pytest

from mentionkit import MentionParseError, parse_mentions, summarize_mentions_for_prompt


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


def test_prompt_summary_never_includes_ids() -> None:
    page_context = {
        "mentions": [
            {"type": "contact", "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8", "label": "Dwight Schrute"}
        ]
    }
    mentions = parse_mentions(page_context)
    summary = summarize_mentions_for_prompt(mentions)
    assert summary is not None
    assert "Dwight Schrute" in summary
    assert "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8" not in summary


