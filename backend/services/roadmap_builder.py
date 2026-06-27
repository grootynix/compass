import json
from schemas.pydantic_models import RoadmapOutputSchema
from services.openai_service import generate_roadmap_json
from fastapi import HTTPException


async def build_roadmap(messages: list[dict], system_prompt: str) -> RoadmapOutputSchema:
    raw_json = await generate_roadmap_json(messages, system_prompt)
    try:
        data = json.loads(raw_json)
        return RoadmapOutputSchema(**data)
    except Exception:
        # Retry once with a correction note
        retry_messages = messages + [
            {
                "role": "user",
                "content": "Your previous response had invalid JSON. Return ONLY valid JSON matching the schema exactly. No extra text.",
            }
        ]
        raw_json = await generate_roadmap_json(retry_messages, system_prompt)
        try:
            data = json.loads(raw_json)
            return RoadmapOutputSchema(**data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse roadmap JSON after retry. Your conversation is saved.",
            )
