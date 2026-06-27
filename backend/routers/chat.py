from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from models.db import get_db, Session, Message
from schemas.pydantic_models import ChatRequest, ChatResponse
from services.openai_service import chat_with_intake
from datetime import datetime
from pathlib import Path

router = APIRouter()

INTAKE_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "intake_system.txt"


def load_intake_prompt() -> str:
    return INTAKE_PROMPT_PATH.read_text()


def estimate_progress(messages: list) -> int:
    dimensions = ["skill", "city", "life stage", "time", "income", "energy"]
    content = " ".join(m.content.lower() for m in messages if m.role == "assistant")
    covered = sum(1 for d in dimensions if d in content)
    return min(int((covered / 6) * 90), 90)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == request.session_id).first()
    if not session:
        session = Session(id=request.session_id)
        db.add(session)
        db.commit()

    history = (
        db.query(Message)
        .filter(Message.session_id == request.session_id)
        .order_by(Message.created_at)
        .all()
    )

    system_prompt = load_intake_prompt()

    if request.message == "__init__":
        seed = "Hi! I'm Compass. I'm here to help you figure out a career path that actually fits your life — not just a generic list of job titles. Tell me a bit about yourself. What do you love doing, even if you've never been paid for it?"
        msg = Message(session_id=request.session_id, role="assistant", content=seed)
        db.add(msg)
        db.commit()
        return ChatResponse(
            session_id=request.session_id,
            reply=seed,
            intake_complete=False,
            progress=0,
        )

    user_msg = Message(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    history = (
        db.query(Message)
        .filter(Message.session_id == request.session_id)
        .order_by(Message.created_at)
        .all()
    )
    openai_messages = [{"role": m.role, "content": m.content} for m in history]

    try:
        reply = await chat_with_intake(openai_messages, system_prompt)
    except HTTPException:
        reply = "I'm having trouble connecting right now. Please try again in a moment."
        return ChatResponse(
            session_id=request.session_id,
            reply=reply,
            intake_complete=False,
            progress=estimate_progress(history),
        )

    intake_complete = "[INTAKE_COMPLETE]" in reply
    clean_reply = reply.replace("[INTAKE_COMPLETE]", "").strip()

    assistant_msg = Message(session_id=request.session_id, role="assistant", content=clean_reply)
    db.add(assistant_msg)

    if intake_complete:
        session.completed_at = datetime.utcnow()
        db.commit()

    db.commit()

    progress = 100 if intake_complete else estimate_progress(history)

    return ChatResponse(
        session_id=request.session_id,
        reply=clean_reply,
        intake_complete=intake_complete,
        progress=progress,
    )
