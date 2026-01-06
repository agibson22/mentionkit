## mentionkit

Secure, ID-backed `@mentions` (“pills”) for LLM chat UIs.

### Why?
Built because `@mentions` are common, annoying to build, and easily insecure.

### What it does
- **Users select entities** (e.g. contacts/meetings) as atomic pills.
- **Clients send IDs to your backend** as structured mention payloads.
- **Backends resolve deterministically** by ID (scoped to the current tenant/account).
- **LLMs never see IDs** — prompts use labels/counts only.

### Payload shape

```json
{
  "content": "Schedule @contact Dwight",
  "page_context": {
    "mentions": [
      { "type": "contact", "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8", "label": "Dwight Schrute" }
    ]
  }
}
```

### Configuration

#### Type Aliases

If your app uses different mention type strings, pass an alias map when normalizing:

```python
from mentionkit import normalize_mention_type

ALIASES = {"event": "meeting"}
canonical = normalize_mention_type("event", aliases=ALIASES)
```

### Python usage

```python
from mentionkit import parse_mentions, summarize_mentions_for_prompt

mentions = parse_mentions(page_context, aliases={"event": "meeting"})
prompt_hint = summarize_mentions_for_prompt(mentions)  # labels/types only; no IDs

contact = mentions.ensure_at_most_one("contact")
if contact:
    contact_id = contact.id  # UUID
```

### Validation (tenant/account scoping)

mentionkit is DB-agnostic. Your app can validate that mention IDs exist and belong to the current tenant/account:

```python
from mentionkit import parse_and_validate_mentions

mentions = await parse_and_validate_mentions(page_context, validator=my_validator)
```

### Docs
- `SPEC.md`: contract + privacy boundary
- `SECURITY.md`: threat model + implementation guidance

### Status
v0.1 — extracting from a production app and dogfooding first.
