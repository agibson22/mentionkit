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

### Docs
- `SPEC.md`: contract + privacy boundary
- `SECURITY.md`: threat model + implementation guidance

### Status
v0.1 — extracting from a production app and dogfooding first.
