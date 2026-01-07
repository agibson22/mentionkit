"""mentionkit: Secure, ID-backed @mentions (“pills”) for LLM chat UIs.

See repository `SPEC.md` for the contract and privacy boundary.
"""

from mentionkit.normalize import normalize_mention_type
from mentionkit.parse import MentionParseError, MentionsResult, TooManyMentionsError, parse_mentions
from mentionkit.summarize import summarize_mentions_for_prompt
from mentionkit.types import Mention
from mentionkit.validate import MentionValidator, parse_and_validate_mentions

__all__ = [
    "Mention",
    "MentionParseError",
    "MentionValidator",
    "MentionsResult",
    "TooManyMentionsError",
    "normalize_mention_type",
    "parse_mentions",
    "parse_and_validate_mentions",
    "summarize_mentions_for_prompt",
]
