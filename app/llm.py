import json

import httpx

from app.config import settings


async def enrich_findings(findings):
    """Optional OpenAI-compatible rationale refinement; deterministic scanner works without it."""
    if not settings.llm_api_key or not findings:
        return findings

    payload = {
        "model": settings.llm_model,
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You review static code-audit findings for missing observability. "
                    "Return JSON object with a findings array; each item has id, rationale, "
                    "suggested_code. Be conservative, state uncertainty, and never recommend "
                    "logging secrets, tokens, credentials, personal data, or full request "
                    "payloads. Do not invent file locations."
                ),
            },
            {"role": "user", "content": json.dumps([f.model_dump() for f in findings])},
        ],
    }
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json=payload,
        )
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    items = data.get("findings", []) if isinstance(data, dict) else data
    by_id = {item.get("id"): item for item in items if isinstance(item, dict)}
    return [
        f.model_copy(
            update={
                "rationale": str(by_id.get(f.id, {}).get("rationale", f.rationale))[:3000],
                "suggested_code": str(
                    by_id.get(f.id, {}).get("suggested_code", f.suggested_code)
                )[:3000],
            }
        )
        for f in findings
    ]
