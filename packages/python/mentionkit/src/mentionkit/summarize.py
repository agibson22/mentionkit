from __future__ import annotations

from mentionkit.parse import MentionsResult


def summarize_mentions_for_prompt(
    mentions: MentionsResult,
    *,
    max_labels_per_type: int = 3,
) -> str | None:
    """Build a prompt-safe mentions summary.

    This summary is safe to include in prompts/logs because it uses only:
    - mention types
    - mention labels (display text)
    - counts

    It must never include stable IDs.
    """

    if not mentions.by_type:
        return None

    parts: list[str] = []
    for mention_type, items in mentions.by_type.items():
        if not items:
            continue

        labels = [m.label for m in items if m.label]
        if labels:
            shown = ", ".join(labels[:max_labels_per_type])
            extra = len(labels) - max_labels_per_type
            suffix = "" if extra <= 0 else f" (+{extra} more)"
            parts.append(f"{mention_type}=[{shown}{suffix}]")
        else:
            parts.append(f"{mention_type}={len(items)}")

    if not parts:
        return None

    return "Mentions: " + "; ".join(parts)


__all__ = ["summarize_mentions_for_prompt"]
