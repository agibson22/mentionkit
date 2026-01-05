### mentionkit Spec (v0.1)

This document defines the **wire contract** and **privacy boundary** for ID-backed `@mentions` (“pills”) used in LLM chat UIs and downstream tool execution.

### Goals
- **Deterministic resolution**: when a mention pill is present, the backend resolves the exact entity by ID (no fuzzy guessing).
- **Good UX**: users can insert/delete mentions as atomic units.
- **Strong privacy boundary**: stable identifiers (IDs) are never included in LLM prompts.

---

### Terms
- **Mention**: a structured reference to an entity (e.g., a contact) with an authoritative `id`.
- **Pill**: the UI representation of a mention, treated as an atomic unit in editing.
- **Label**: human-readable text for display only (not authoritative).
- **ID**: an opaque identifier (often a UUID) authoritative for backend resolution.
- **Tenant/Account scope**: the boundary within which an ID is considered valid (multi-tenant safety).

---

### Payload contract
Mentions are transmitted as part of a request-scoped `page_context` object:

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

#### `page_context.mentions[]` fields
- **type** (required, string): entity type. Examples: `contact`, `meeting`, `assignment`.
- **id** (required, string): opaque identifier. Treat as untrusted input until validated.
- **label** (optional, string): display label; may be stale or incorrect.

#### Editing semantics (frontend)
- Mentions must be edited as **atomic units**:
  - Inserting a mention produces exactly one structured mention entry.
  - Deleting the pill removes that mention’s `{type,id,label}` from the derived payload.
- Multiple mentions may be present, including multiple of the same type and/or same id.
- Duplicate mentions are allowed (even with the same `{type,id}`); servers and tools may dedupe or preserve duplicates depending on the use case.
- Frontends should derive `page_context.mentions` from editor state at send-time (not from regex tokenization).

---

### Backend resolution rules
Backends must treat `page_context.mentions` as **untrusted** input and apply:
- **Type normalization** (optional but recommended): map aliases to canonical types (example: `event -> meeting`).
- **ID parsing**: parse `id` into your canonical identifier type (UUID, ULID, etc). Reject invalid formats.
- **Tenant scoping validation (strongly recommended)**:
  - Verify each referenced entity exists **and belongs to the caller’s tenant/account**.
  - If validation fails, return an error rather than silently falling back to fuzzy logic.

#### Agent Tool behavior (recommended for proper Agent behavior)
When a tool needs an entity:
- **Prefer mention IDs** when a suitable mention is present.
- If no mention is present, MAY fall back to fuzzy search on user-provided text.
- If multiple mentions of the needed type are present, tools should request disambiguation (or define a deterministic rule like “first mention wins”).

---

### Prompt privacy boundary (critical)
LLM prompts _must never_ contain stable identifiers:
- Do not include `id` values (UUID/ULID/etc) in:
  - System prompts
  - User prompts
  - Tool descriptions shown to the model
  - “Recent conversation” snippets appended to prompts
  - Anything else that may go to an LLM or outside party

Prompts MAY include safe summaries derived from mentions:
- Mention **types** (e.g., `contact`, `meeting`)
- Mention **labels** (user-facing names) and/or counts

Example safe summary:

```text
Mentions: contact=[Dwight Schrute]; meeting=[Conference Room All Hands] (+2 more)
```

#### Logging guidance
- Logs intended for debugging prompts should not include IDs.
- If operational logs must include IDs (e.g., server-side tool execution logs), keep them **out of prompt logs** and follow your normal security controls (PII retention, access control).

---

### Error semantics (recommended)
When mention payload is present but invalid, prefer explicit errors over silent fallback:
- Invalid `id` format → “Invalid mention id format.”
- Unknown `type` (after normalization) → “Unsupported mention type.”
- Cross-tenant or not-found → “Mention not found in this account.”
- Too many mentions for a tool expecting one → “Multiple mentions provided; disambiguation required.”

---

### Versioning
- This spec version is **v0.1**.
- Backwards-incompatible changes should bump the spec major/minor and be documented in the changelog.


