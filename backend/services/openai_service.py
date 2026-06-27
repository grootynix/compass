import os
from openai import AsyncOpenAI
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def chat_with_intake(messages: list[dict], system_prompt: str) -> str:
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            temperature=0.7,
            messages=[{"role": "system", "content": system_prompt}] + messages,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")


async def generate_roadmap_json(messages: list[dict], system_prompt: str) -> str:
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[{"role": "system", "content": system_prompt}] + messages,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")
