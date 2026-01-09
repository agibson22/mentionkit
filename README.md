## mentionkit

[![CI](https://img.shields.io/github/actions/workflow/status/agibson22/mentionkit/ci.yml?branch=main)](https://github.com/agibson22/mentionkit/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

Secure, ID-backed `@mentions` (“pills”) for LLM chat UIs.

### Live demo

GitHub Pages demo: https://agibson22.github.io/mentionkit/

### Packages
- Python: `packages/python/mentionkit/`
- React: `packages/react/mentionkit-react/`

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

### React usage (v0.2 API)

`mentionkit-react` exports a controlled `MentionComposer`:

```tsx
import { useState } from "react"
import { MentionComposer, type MentionComposerValue } from "mentionkit-react"

const [value, setValue] = useState<MentionComposerValue>({ text: "", mentions: [] })

<MentionComposer
  value={value}
  onChange={setValue}
  placeholder="Try: @contact Dwight"
  getSuggestions={async (query) => {
    // Return [{ type, id, label }] from your API/search layer.
    return []
  }}
/>
```

- `value.text`: plain text that can be sent to an LLM
- `value.mentions`: structured pills `{ type, id, label }` for backend resolution
- `getSuggestions(query)`: called when user types an `@...` token; return suggestions with `{ type, id, label }`

#### Headless API (custom renderers)

If you want to keep your own look/feel, `mentionkit-react` also exports a headless hook:

```tsx
import { useMentionComposer } from "mentionkit-react"
```

The demo shows two renderers built on the same headless core: a vanilla `MentionComposer` and a “shadcn-styled” example implemented in the demo app (without adding shadcn/tailwind deps to `mentionkit-react`).

### Duplicate mentions (UI vs backend)

The spec allows duplicate mentions (even the same `{type,id}` repeated). You can choose where to dedupe:

- **Frontend (insertion time)**: `MentionComposer` supports `duplicatePolicy`:
  - `"allow"` (default)
  - `"dedupeByTypeId"` (ignore inserting an already-present `{type,id}` mention)
- **Backend parsing**: Python `parse_mentions(...)` currently defaults to `dedupe=True` and will dedupe by `(type,id)`.
  - If you need to preserve duplicates, pass `dedupe=False`.
  - Be aware selectors like `ensure_at_most_one(...)` will raise if multiple mentions of a type are present.

### Docs
- `SPEC.md`: contract + privacy boundary
- `SECURITY.md`: threat model + implementation guidance
- `examples/demo/README.md`: local demo (mentionkit-react)
- `examples/api/README.md`: local backend demo API (FastAPI)

### Publishing / releases (monorepo)

This repo publishes **two packages** (versioned independently):

- **npm**: `mentionkit-react` (`packages/react/mentionkit-react/`)
- **PyPI**: `mentionkit` (`packages/python/mentionkit/`)

#### Release `mentionkit-react` (npm)

1. Bump version in `packages/react/mentionkit-react/package.json`
2. Commit and push to `main`
3. Create and push a tag in the form `react-vX.Y.Z` (must match the package.json version)

Notes:
- npm publishing uses **Trusted Publishing (OIDC)** via `.github/workflows/publish-npm.yml`
- In npm package settings → **Trusted Publisher**, the **Workflow filename** must be `publish-npm.yml`

#### Release `mentionkit` (PyPI)

1. Bump version in `packages/python/mentionkit/pyproject.toml`
2. Commit and push to `main`
3. Create and push a tag in the form `py-vX.Y.Z` (must match the pyproject.toml version)

Notes:
- PyPI publishing uses **Trusted Publishing (OIDC)** via `.github/workflows/publish-pypi.yml`

### Status
v0.2 — dogfooding and iterating (see `CHANGELOG.md` for release notes).

### Roadmap (tbd)

- **Backend demo API (FastAPI)**: add `examples/api` with `/suggest` + `/resolve` for an end-to-end deterministic resolution demo.
- **Non-UUID IDs**: add support for ULID/ObjectId/int in Python parsing/validation while preserving the “IDs never in prompts” boundary.
