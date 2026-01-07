## mentionkit backend demo (FastAPI)

This is a tiny demo API for **tenant-scoped, deterministic mention resolution**.

- `GET /suggest`: returns `{ type, id, label }` suggestions (what the UI needs)
- `POST /resolve`: validates + resolves mention IDs (tenant-scoped) and returns a **prompt-safe summary** (labels/types only; no IDs)

### Run locally

From the repo root:

```bash
python -m venv .venv
source .venv/bin/activate

pip install -e packages/python/mentionkit
pip install -r examples/api/requirements.txt

python examples/api/app.py
```

The API will start on `http://127.0.0.1:8000`.

### Try it

#### Suggestions

```bash
curl -s 'http://127.0.0.1:8000/suggest?q=dwight' -H 'X-Tenant-Id: demo'
```

#### Resolve

```bash
curl -s 'http://127.0.0.1:8000/resolve' \
  -H 'Content-Type: application/json' \
  -H 'X-Tenant-Id: demo' \
  -d '{
    "page_context": {
      "mentions": [
        { "type": "contact", "id": "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8", "label": "Dwight Schrute" }
      ]
    }
  }'
```

### Security notes (demo-relevant)
- Mentions are **untrusted input**. The demo validates ID format and tenant scope server-side.
- **Do not put stable IDs in prompts or prompt logs.** The `/resolve` response includes a `prompt_safe_summary` that contains only labels/types/counts.
- Labels can be attacker-controlled; the demo’s summary uses **server-authoritative labels** from the resolution layer.


