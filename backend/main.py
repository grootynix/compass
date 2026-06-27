from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, roadmap
from models.db import init_db
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Compass API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])


@app.get("/api/session/{session_id}")
async def session_status(session_id: str):
    from models.db import SessionLocal, Session, Roadmap
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return {"exists": False, "intake_complete": False, "roadmap_ready": False}
        roadmap = db.query(Roadmap).filter(Roadmap.session_id == session_id).first()
        return {
            "exists": True,
            "intake_complete": session.completed_at is not None,
            "roadmap_ready": roadmap is not None,
        }
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    init_db()
