# Compass

Compass is a hyper-personalized AI career guidance web app. It runs a warm, conversational intake interview to understand your skills, city, life stage, available time, income urgency, and energy map — then generates a structured, city-aware career roadmap with 2–4 distinct paths, week-by-week milestones, platform recommendations, and income projections.

## Prerequisites

- Node 18+
- Python 3.11+
- An OpenAI API key (GPT-4o access required)

## Setup

```bash
# 1. Clone / enter the project
cd compass

# 2. Backend setup
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install
```

## Running

Open two terminals:

```bash
# Terminal 1 — backend
cd compass/backend
uvicorn main:app --reload
# Runs on http://localhost:8000

# Terminal 2 — frontend
cd compass/frontend
npm run dev
# Runs on http://localhost:5173
```

Then open `http://localhost:5173` in your browser.

## How to use

1. Open the app — Compass greets you and starts a natural conversation
2. Chat freely — share your skills, where you live, your life situation, time availability, income needs, and what energizes you
3. After enough information is gathered, Compass automatically generates your personalized roadmap
4. Review your 2–4 career paths, each with a week-by-week action plan, platform list, and income projections
5. Click "Start Over" to reset and begin a new session

## Architecture

**Backend** is a FastAPI app that manages conversation sessions in SQLite via SQLAlchemy. Each user gets a UUID session stored in their browser's localStorage. The `/api/chat` endpoint maintains full message history per session, calls GPT-4o with a conversational intake system prompt, and detects a `[INTAKE_COMPLETE]` signal token when the AI has gathered enough information. The `/api/roadmap/generate` endpoint then calls GPT-4o again with a structured JSON schema to produce the roadmap, which is persisted and re-served on refresh.

**Frontend** is a React 18 + Vite app styled with Tailwind CSS using a custom dark design system. The intake page renders a premium chat interface with animated typing indicators and a progress bar. The roadmap page displays the generated career paths as expandable cards with a milestone timeline, platform links, skill gap tags, and an income projection strip. Session state is entirely client-side via localStorage with server-side validation on load.
# compass
