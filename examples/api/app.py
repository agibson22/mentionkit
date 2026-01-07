from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Mapping, Optional
from uuid import UUID

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from mentionkit import Mention, MentionParseError, MentionsResult, parse_and_validate_mentions, summarize_mentions_for_prompt


@dataclass(frozen=True)
class Entity:
    type: str
    id: str
    label: str


# Tiny, deterministic, tenant-scoped dataset (demo-only).
# IDs match the existing frontend demo's mocked suggestions so full-stack mode feels seamless.
DATASET: Dict[str, Dict[str, Dict[str, Entity]]] = {
    "demo": {
        "contact": {
            "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8": Entity(
                type="contact",
                id="4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8",
                label="Dwight Schrute",
            ),
            "11111111-1111-4111-8111-111111111111": Entity(
                type="contact",
                id="11111111-1111-4111-8111-111111111111",
                label="Jim Halpert",
            ),
        },
        "meeting": {
            "22222222-2222-4222-8222-222222222222": Entity(
                type="meeting",
                id="22222222-2222-4222-8222-222222222222",
                label="Conference Room All Hands",
            ),
        },
        "assignment": {
            "33333333-3333-4333-8333-333333333333": Entity(
                type="assignment",
                id="33333333-3333-4333-8333-333333333333",
                label="Follow up with David",
            ),
        },
    }
}


class MentionSuggestion(BaseModel):
    type: str
    id: str
    label: str


class ResolveRequest(BaseModel):
    page_context: Optional[Mapping[str, Any]] = Field(default=None)


class ResolveResponseResolved(BaseModel):
    type: str
    id: str
    label: str


class ResolveResponse(BaseModel):
    tenant_id: str
    resolved: List[ResolveResponseResolved]
    prompt_safe_summary: Optional[str]


class InMemoryTenantValidator:
    def __init__(self, *, tenant_id: str):
        self.tenant_id = tenant_id

    async def validate(self, mentions: MentionsResult[UUID]) -> None:
        tenant_data = DATASET.get(self.tenant_id)
        if tenant_data is None:
            raise ValueError("Unknown tenant.")

        for mention_type, items in mentions.by_type.items():
            type_data = tenant_data.get(mention_type)
            if type_data is None:
                raise ValueError("Unsupported mention type.")
            for m in items:
                if str(m.id) not in type_data:
                    raise ValueError("Mention not found in this account.")


app = FastAPI(title="mentionkit demo API", version="0.1.0")

# Demo-friendly CORS (lets the local Vite demo call the API).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/suggest", response_model=List[MentionSuggestion])
def suggest(
    q: str = Query(default="", description="Search query (label/type substring match)"),
    x_tenant_id: str = Header(default="demo", alias="X-Tenant-Id"),
) -> List[MentionSuggestion]:
    tenant_data = DATASET.get(x_tenant_id)
    if tenant_data is None:
        raise HTTPException(status_code=404, detail="Unknown tenant.")

    query = q.strip().lower()
    out: List[MentionSuggestion] = []
    for mention_type, by_id in tenant_data.items():
        for ent in by_id.values():
            if not query or query in f"{mention_type} {ent.label}".lower():
                out.append(MentionSuggestion(type=ent.type, id=ent.id, label=ent.label))

    return out[:6]


@app.post("/resolve", response_model=ResolveResponse)
async def resolve(
    body: ResolveRequest,
    x_tenant_id: str = Header(default="demo", alias="X-Tenant-Id"),
) -> ResolveResponse:
    try:
        mentions = await parse_and_validate_mentions(
            body.page_context,
            validator=InMemoryTenantValidator(tenant_id=x_tenant_id),
        )
    except MentionParseError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    tenant_data = DATASET.get(x_tenant_id) or {}

    # Important: labels can be attacker-controlled. For the prompt-safe summary, we prefer
    # authoritative labels from our server-side resolution layer (not the incoming payload label).
    resolved_items: List[ResolveResponseResolved] = []
    resolved_by_type: Dict[str, List[Mention[UUID]]] = {}

    for mention_type, items in mentions.by_type.items():
        for m in items:
            ent = (tenant_data.get(mention_type) or {}).get(str(m.id))
            if ent is None:
                # Shouldn't happen because validator checks, but keep it explicit.
                raise HTTPException(status_code=400, detail="Mention not found in this account.")

            resolved_items.append(ResolveResponseResolved(type=mention_type, id=ent.id, label=ent.label))
            resolved_by_type.setdefault(mention_type, []).append(
                Mention(type=mention_type, id=m.id, label=ent.label)
            )

    prompt_safe_summary = summarize_mentions_for_prompt(MentionsResult(by_type=resolved_by_type))
    return ResolveResponse(tenant_id=x_tenant_id, resolved=resolved_items, prompt_safe_summary=prompt_safe_summary)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)


