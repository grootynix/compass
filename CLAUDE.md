# Compass — Project Memory

AI career guidance app. Intake chat → structured roadmap. No auth, SQLite, localhost-only MVP.

## Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy (SQLite), OpenAI Python SDK (gpt-4o), python-dotenv
- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios, uuid

## Running
```bash
# Backend (from compass/backend/)
uvicorn main:app --reload        # http://localhost:8000

# Frontend (from compass/frontend/)
npm run dev                      # http://localhost:5173
```

## Implemented Features

### Backend
- [x] SQLite DB with 3 tables: `sessions`, `messages`, `roadmaps`
- [x] `POST /api/chat` — conversational intake, stores full history, detects `[INTAKE_COMPLETE]` token, estimates progress 0–100
- [x] `POST /api/roadmap/generate` — reads full convo, calls GPT-4o in JSON mode, persists roadmap
- [x] `GET /api/roadmap/{session_id}` — fetch persisted roadmap (survives refresh)
- [x] `GET /api/session/{session_id}` — session status (exists, intake_complete, roadmap_ready)
- [x] OpenAI service with retry on JSON parse failure
- [x] CORS configured for http://localhost:5173
- [x] `__init__` message triggers seed greeting without LLM call

### Frontend
- [x] UUID session management via localStorage (`compass_session_id`)
- [x] Intake chat page: full-viewport, animated bubbles, typing indicator, progress bar
- [x] Auto-redirect to `/roadmap` after intake completes + roadmap generated
- [x] Roadmap page: hero, income timeline chips, sortable path cards, encouragement section
- [x] `RoadmapCard`: expandable, fit score dots, effort badge, milestone timeline, platforms, skill gaps
- [x] "Start Over" clears localStorage and returns to `/`
- [x] Axios error handling — never crashes, shows inline error messages
- [x] Vite proxy: `/api` → `http://localhost:8000`

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI entrypoint, CORS, router registration, DB init |
| `backend/routers/chat.py` | Chat endpoint, progress estimation, session creation |
| `backend/routers/roadmap.py` | Roadmap generate/fetch, session status |
| `backend/services/openai_service.py` | Async OpenAI calls (chat + JSON mode) |
| `backend/services/roadmap_builder.py` | Build + validate roadmap with 1 retry |
| `backend/models/db.py` | SQLAlchemy models + `get_db` dependency |
| `backend/schemas/pydantic_models.py` | All Pydantic schemas incl. nested roadmap |
| `backend/prompts/intake_system.txt` | 6-dimension intake system prompt |
| `backend/prompts/roadmap_system.txt` | Roadmap JSON schema system prompt |
| `frontend/src/pages/IntakePage.jsx` | Chat UI, `__init__` handshake, roadmap trigger |
| `frontend/src/pages/RoadmapPage.jsx` | Roadmap display page |
| `frontend/src/components/RoadmapCard.jsx` | Expandable career path card |
| `frontend/src/hooks/useSession.js` | Session UUID lifecycle |
| `frontend/src/api/client.js` | Axios wrapper for all API calls |

## Design System (Tailwind custom colors)
```
compass-bg:           #0F0F14  (page background)
compass-surface:      #1A1A24  (cards, inputs)
compass-border:       #2A2A3A  (dividers)
compass-accent:       #7C6FCD  (primary — indigo)
compass-accent-bright:#A89EE0  (hover)
compass-text:         #E8E6F0  (body text)
compass-muted:        #8A8799  (secondary text)
compass-success:      #5BBFA0  (milestones, low effort)
compass-warning:      #E8A45A  (skill gaps, high effort)
```

## Intake Flow
1. Frontend POSTs `message: "__init__"` on first load
2. Backend returns seed greeting without calling LLM
3. Each user message → full history sent to GPT-4o with intake system prompt
4. AI appends `[INTAKE_COMPLETE]` to final message when all 6 dimensions covered
5. Backend strips token, sets `session.completed_at`, returns `intake_complete: true`
6. Frontend POSTs to `/api/roadmap/generate`, navigates to `/roadmap`

## Not Built (Post-MVP)
- Auth, payments, email, admin dashboard, PDF export, sharing, mobile app
- Multiple roadmap versions, external APIs beyond OpenAI
