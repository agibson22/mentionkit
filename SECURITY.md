### Security Policy

`mentionkit` is designed around a simple but strict boundary:

- **Stable identifiers (e.g., UUIDs) must never be leaked to an LLM** (or any third party) via prompts.
- Identifiers are used only **UI → backend → tool execution**, where normal access controls & business logic apply.

If you adopt `mentionkit`, you are adopting this boundary.

---

### Threat model (what we’re protecting against)

- **Identifier exfiltration to an LLM provider**: leaking entity IDs (UUID/ULID/etc) in prompts, prompt-logs, or other model-visible text.
- **Cross-tenant data access**: accepting a mention ID that belongs to a different account/tenant and accidentally operating on it.
- **Prompt-injection via labels**: labels are user-controlled text; they can try to influence routing or tool selection if you blindly paste them into prompts.

---

### Security guarantees (what `mentionkit` aims to guarantee)

- **The spec requires a privacy boundary**: IDs do not go into prompts. See `SPEC.md`.
- **Mentions are treated as untrusted input**: IDs must be parsed/validated server-side.
- **Tenant scoping is strongly recommended**: validate that mentioned entities belong to the current tenant/account.

`mentionkit` cannot enforce your application’s authorization rules; you must apply them in your validator / data layer.

---

### Implementation guidance

#### Do
- **Validate IDs server-side** (format + existence + tenant/account scope).
- Prefer **mention-first resolution** in tools; only fall back to fuzzy logic when no mention is present.
- Keep **prompt logs** separate from **tool execution logs**.
- Treat `label` as display-only; it may be stale or attacker-controlled.

#### Don’t
- Don’t include `id` values in:
  - System prompts
  - User prompts
  - Tool descriptions shown to the model
  - “Recent conversation” prompt appendices
  - Debug logging that captures prompts
- Don’t silently fall back to fuzzy resolution if a mention is present but invalid.

---

### Logging guidance

Recommended pattern:
- **Prompt logs**: labels-only summaries (types, labels, counts). No IDs.
- **Operational logs** (if needed): may include IDs, but should never be copied into prompts or prompt logs.

---

### Reporting vulnerabilities

If you believe you’ve found a security vulnerability:
- Please open a GitHub Security Advisory, or contact the project maintainer.
- Include a minimal reproduction and impact assessment (what could be leaked or accessed).
