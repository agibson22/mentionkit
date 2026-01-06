from __future__ import annotations

from typing import Dict, List, Optional

from mentionkit.parse import MentionsResult


def summarize_mentions_for_prompt(
    mentions: MentionsResult,
    *,
    max_labels_per_type: int = 3,
) -> Optional[str]:
    """Build a prompt-safe mentions summary.

    This summary is safe to include in prompts/logs because it uses only:
    - mention types
    - mention labels (display text)
    - counts

    It must never include stable IDs.
    """

    if not mentions.by_type:
        return None

    parts: List[str] = []
    for mention_type, items in mentions.by_type.items():
        if not items:
            continue

        labels = [m.label for m in items if m.label]
        if labels:
            shown = ", ".join(labels[:max_labels_per_type])
            suffix = "" if len(labels) <= max_labels_per_type else f" (+{len(labels) - max_labels_per_type} more)"
            parts.append(f"{mention_type}=[{shown}{suffix}]")
        else:
            parts.append(f"{mention_type}={len(items)}")

    if not parts:
        return None

    return "Mentions: " + "; ".join(parts)


__all__ = ["summarize_mentions_for_prompt"]


