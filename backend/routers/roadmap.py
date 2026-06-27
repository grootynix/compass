from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from models.db import get_db, Session, Message, Roadmap
from schemas.pydantic_models import RoadmapGenerateRequest, RoadmapOutputSchema, SessionStatusResponse
from services.roadmap_builder import build_roadmap
import json
from pathlib import Path

router = APIRouter()

ROADMAP_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "roadmap_system.txt"


def load_roadmap_prompt() -> str:
    return ROADMAP_PROMPT_PATH.read_text()


@router.post("/generate", response_model=RoadmapOutputSchema)
async def generate_roadmap(request: RoadmapGenerateRequest, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = db.query(Roadmap).filter(Roadmap.session_id == request.session_id).first()
    if existing:
        return RoadmapOutputSchema(**json.loads(existing.paths_json))

    history = (
        db.query(Message)
        .filter(Message.session_id == request.session_id)
        .order_by(Message.created_at)
        .all()
    )
    openai_messages = [{"role": m.role, "content": m.content} for m in history]

    system_prompt = load_roadmap_prompt()
    roadmap = await build_roadmap(openai_messages, system_prompt)

    roadmap_dict = roadmap.model_dump()
    db_roadmap = Roadmap(
        session_id=request.session_id,
        title=roadmap.title,
        summary=roadmap.summary,
        paths_json=json.dumps(roadmap_dict),
    )
    db.add(db_roadmap)
    db.commit()

    return roadmap


@router.get("/{session_id}", response_model=RoadmapOutputSchema)
async def get_roadmap(session_id: str, db: DBSession = Depends(get_db)):
    roadmap = db.query(Roadmap).filter(Roadmap.session_id == session_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return RoadmapOutputSchema(**json.loads(roadmap.paths_json))


@router.get("/session/{session_id}/status", response_model=SessionStatusResponse)
async def session_status(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        return SessionStatusResponse(exists=False, intake_complete=False, roadmap_ready=False)
    roadmap = db.query(Roadmap).filter(Roadmap.session_id == session_id).first()
    return SessionStatusResponse(
        exists=True,
        intake_complete=session.completed_at is not None,
        roadmap_ready=roadmap is not None,
    )
