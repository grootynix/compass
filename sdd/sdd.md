# Compass — MVP System Design Document
### Feed this entire document to Claude to build the MVP

---

## 0. INSTRUCTIONS FOR CLAUDE (READ FIRST)

You are building **Compass**, a hyper-personalized AI career guidance web app.
Build everything described below. Do not skip sections. Do not simplify features
unless explicitly marked [STRETCH]. Ask no clarifying questions — all decisions
are made here. When you finish, show me the full folder tree and how to run it.

Stack:
- **Backend:** Python 3.11, FastAPI, OpenAI Python SDK (GPT-4o)
- **Frontend:** React 18, Vite, Tailwind CSS
- **Storage:** SQLite via SQLAlchemy (no Postgres for MVP)
- **Auth:** None (session-based with a UUID stored in localStorage)
- **Deployment target:** localhost (dev only for MVP)

---

## 1. PRODUCT OVERVIEW

Compass helps people with many skills but no clear direction find a
personalized, city-aware, income-realistic career roadmap through a
conversational AI intake, followed by a structured roadmap output.

**MVP scope:** One linear flow — Intake Chat → Roadmap View. No login,
no dashboard, no payments. Just the core value loop working end-to-end.

---

## 2. FOLDER STRUCTURE

Create this exact structure:

```
compass/
├── backend/
│   ├── main.py               # FastAPI app entrypoint
│   ├── routers/
│   │   ├── chat.py           # /api/chat endpoint
│   │   └── roadmap.py        # /api/roadmap endpoint
│   ├── services/
│   │   ├── openai_service.py # All OpenAI calls live here
│   │   └── roadmap_builder.py# Roadmap assembly logic
│   ├── models/
│   │   └── db.py             # SQLAlchemy models + DB init
│   ├── schemas/
│   │   └── pydantic_models.py# Request/response schemas
│   ├── prompts/
│   │   ├── intake_system.txt # System prompt for intake chat
│   │   └── roadmap_system.txt# System prompt for roadmap gen
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── IntakePage.jsx      # The chat UI
│   │   │   └── RoadmapPage.jsx     # The roadmap output UI
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── RoadmapCard.jsx
│   │   │   ├── MilestoneTimeline.jsx
│   │   │   └── SkillTag.jsx
│   │   ├── hooks/
│   │   │   └── useSession.js       # UUID session management
│   │   ├── api/
│   │   │   └── client.js           # Axios wrapper
│   │   └── styles/
│   │       └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 3. DATABASE SCHEMA

Use SQLite. Create these tables via SQLAlchemy with `Base.metadata.create_all()`.

### Table: `sessions`
| Column         | Type     | Notes                          |
|----------------|----------|--------------------------------|
| id             | String   | UUID, primary key              |
| created_at     | DateTime | default now                    |
| completed_at   | DateTime | nullable, set when roadmap gen |
| city           | String   | extracted after intake done    |
| raw_profile    | Text     | JSON blob of extracted profile |

### Table: `messages`
| Column      | Type     | Notes                          |
|-------------|----------|--------------------------------|
| id          | Integer  | autoincrement PK               |
| session_id  | String   | FK → sessions.id               |
| role        | String   | "user" or "assistant"          |
| content     | Text     | message text                   |
| created_at  | DateTime | default now                    |

### Table: `roadmaps`
| Column      | Type     | Notes                          |
|-------------|----------|--------------------------------|
| id          | Integer  | autoincrement PK               |
| session_id  | String   | FK → sessions.id, unique       |
| title       | String   | e.g. "Voice Artist + Content Writer" |
| summary     | Text     | 2–3 sentence overview          |
| paths_json  | Text     | JSON — array of CareerPath     |
| created_at  | DateTime | default now                    |

---

## 4. API ENDPOINTS

### POST `/api/chat`

**Purpose:** Send one user message, get one AI reply. Maintains full conversation
history per session.

**Request body:**
```json
{
  "session_id": "uuid-string",
  "message": "I love cooking and voice work"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "reply": "That's a powerful combination! ...",
  "intake_complete": false,
  "progress": 40
}
```

`intake_complete` becomes `true` when the AI determines it has gathered enough
information (the system prompt instructs it to say `[INTAKE_COMPLETE]` when ready).
`progress` is an integer 0–100 representing how far along the intake is —
estimate it based on how many of the 6 intake dimensions have been covered
(skills, city, life stage, time available, income urgency, energy map).

**Backend logic:**
1. Load all prior messages for this session from DB
2. Append new user message
3. Call OpenAI with full history + intake system prompt
4. Persist assistant reply to DB
5. Check if reply contains `[INTAKE_COMPLETE]`
6. If complete: strip the token from the displayed reply, mark intake done
7. Return response

---

### POST `/api/roadmap/generate`

**Purpose:** Triggered after intake is complete. Reads the full conversation,
extracts a structured profile, then generates a roadmap.

**Request body:**
```json
{
  "session_id": "uuid-string"
}
```

**Response:** Full roadmap JSON (see Roadmap Data Structure below).

**Backend logic:**
1. Load all messages for session
2. Call OpenAI with roadmap system prompt + full conversation as context
3. Ask it to return **only valid JSON** matching the RoadmapOutput schema
4. Parse, validate, persist to `roadmaps` table
5. Return to frontend

---

### GET `/api/roadmap/{session_id}`

**Purpose:** Fetch an already-generated roadmap.

**Response:** Same roadmap JSON as above, or 404 if not found.

---

### GET `/api/session/{session_id}`

**Purpose:** Check if a session exists and what state it's in.

**Response:**
```json
{
  "exists": true,
  "intake_complete": true,
  "roadmap_ready": false
}
```

---

## 5. OPENAI SERVICE

File: `backend/services/openai_service.py`

- Use `AsyncOpenAI` client
- Model: `gpt-4o`
- Temperature for intake chat: `0.7`
- Temperature for roadmap generation: `0.3` (want structured, reliable output)
- For roadmap generation, set `response_format={"type": "json_object"}` so
  OpenAI enforces valid JSON output
- Wrap all calls in try/except, raise HTTPException 500 on failure
- Load `OPENAI_API_KEY` from environment variable via `python-dotenv`

---

## 6. SYSTEM PROMPTS

### `prompts/intake_system.txt`

Write this prompt exactly:

```
You are Compass, a warm and perceptive AI career guide. Your job is to have a
natural, empathetic conversation to understand someone deeply enough to build
them a personalized career roadmap.

You need to gather information across 6 dimensions. DO NOT ask about them as a
checklist. Weave them into natural conversation. Never ask more than one question
at a time.

The 6 dimensions you must cover:
1. SKILLS — What can they do? Include life skills, hobbies, languages, creative
   abilities, technical skills. Dig past job titles.
2. CITY — Where do they live? This shapes what opportunities are realistic.
3. LIFE STAGE — Family situation, dependents, whether they're currently employed.
4. TIME — How many hours per day or week can they dedicate to a career change or
   side income?
5. INCOME URGENCY — Do they need money in 30 days or are they planning for 2 years
   from now? What's the minimum monthly income they need from this new path?
6. ENERGY MAP — What activities make them lose track of time? What drains them?
   This is different from skills — someone can be good at accounting but hate it.

Tone: warm, curious, never clinical. Like a thoughtful friend who happens to know
a lot about careers. Use their name if they share it. Reflect back what you hear.
Occasionally validate their experience ("That's actually a rare combination").

When you have enough information across all 6 dimensions (you don't need perfect
answers, just enough to work with), end your final message with the token
[INTAKE_COMPLETE] on its own line. Do not explain what this token means.

Never mention the 6 dimensions by name. Never say "intake" or "assessment".
Never ask for a resume or formal work history.
```

---

### `prompts/roadmap_system.txt`

Write this prompt exactly:

```
You are Compass, an AI career advisor. You have just completed a conversation
with a user and gathered their profile. Now generate a personalized career
roadmap.

You must return ONLY a valid JSON object. No preamble. No explanation. No
markdown code fences. Just the raw JSON.

The JSON must match this exact schema:

{
  "title": "string — a 4-6 word career identity label e.g. 'Voice Artist & Content Strategist'",
  "summary": "string — 2-3 sentences describing who this person is and why this roadmap fits them",
  "city_note": "string — 1 sentence about the opportunity landscape in their specific city",
  "income_timeline": {
    "month_1_target": "string e.g. ₹5,000",
    "month_3_target": "string",
    "month_12_target": "string",
    "note": "string — one sentence caveat about these estimates"
  },
  "paths": [
    {
      "id": "string — slug e.g. 'voice-over'",
      "title": "string — e.g. 'Voice-Over Artist'",
      "fit_score": "integer 1-10 — how well this matches their profile",
      "why_this_fits": "string — 1-2 sentences specific to this person, not generic",
      "time_to_first_income": "string — e.g. '3-4 weeks'",
      "income_potential": "string — e.g. '₹15,000–₹60,000/month in year 1'",
      "effort_level": "low | medium | high",
      "milestones": [
        {
          "week": "integer",
          "title": "string",
          "action": "string — specific, actionable, e.g. 'Record 3 sample scripts and upload to Voice123 free profile'"
        }
      ],
      "platforms": [
        {
          "name": "string",
          "url": "string",
          "what_to_do": "string — one sentence"
        }
      ],
      "skill_gaps": ["string — e.g. 'Basic audio editing in Audacity'"],
      "first_step_today": "string — one thing they can do in the next 2 hours"
    }
  ],
  "recommended_path_id": "string — id of the single best path for this person right now",
  "encouragement": "string — 2-3 sentences of genuine, specific encouragement based on what you learned about them"
}

Generate 2-4 paths. Make them genuinely different (not all versions of the same
thing). Be specific to their city, skills, and constraints. All rupee amounts
should use ₹ symbol. Be realistic — do not oversell. The milestones array should
have 4-6 entries spread across 8 weeks.
```

---

## 7. ROADMAP DATA STRUCTURE (Pydantic)

In `schemas/pydantic_models.py`, define Pydantic models matching the JSON schema
above exactly. Use these for validation when parsing OpenAI's roadmap output.
If parsing fails, retry the OpenAI call once with a note to fix the JSON.

---

## 8. FRONTEND — PAGES & COMPONENTS

### Design System

Use Tailwind CSS with this custom config in `tailwind.config.js`:

```js
colors: {
  compass: {
    bg: '#0F0F14',          // near-black background
    surface: '#1A1A24',     // card surface
    border: '#2A2A3A',      // subtle borders
    accent: '#7C6FCD',      // soft indigo — primary accent
    'accent-bright': '#A89EE0', // hover state
    text: '#E8E6F0',        // primary text
    muted: '#8A8799',       // secondary text
    success: '#5BBFA0',     // green for milestones
    warning: '#E8A45A',     // amber for effort/gaps
  }
}
```

Font: Use `Inter` from Google Fonts. Import in `index.html`.

---

### `IntakePage.jsx`

This is the main chat interface. It should feel like a premium messaging app.

**Layout:**
- Full viewport height
- Top: Compass logo (text-based, just "compass" in lowercase with accent color
  dot) + progress bar showing intake completion (0–100%)
- Middle: Scrollable message thread
  - Assistant messages: left-aligned, `compass-surface` background bubble
  - User messages: right-aligned, `compass-accent` background bubble
  - Show avatar for assistant (a simple compass rose SVG icon, inline)
- Bottom: Fixed input bar with text input + send button
  - Input placeholder: "Tell me about yourself..."
  - Disabled while waiting for AI response
  - Show `TypingIndicator` component while waiting

**Behavior:**
- On mount: check localStorage for `compass_session_id`
- If none: POST to `/api/chat` with an empty first message to get the
  opening greeting (message = `"__init__"` — handle this on backend by
  sending just the system prompt with no user message and returning the
  opening line)
- Auto-scroll to bottom on new messages
- When `intake_complete: true` comes back: show a brief celebration state
  ("Building your roadmap...") then POST to `/api/roadmap/generate`, then
  navigate to `/roadmap`
- Store `session_id` in localStorage key `compass_session_id`

**Opening message the AI should send** (handle `__init__` on backend):
Trigger the system prompt with a single assistant seed message:
`"Hi! I'm Compass. I'm here to help you figure out a career path that actually fits your life — not just a generic list of job titles. Tell me a bit about yourself. What do you love doing, even if you've never been paid for it?"`

---

### `RoadmapPage.jsx`

The output page. Show the full roadmap.

**Layout (top to bottom):**

1. **Hero section**
   - Large title (the `title` field, e.g. "Voice Artist & Content Strategist")
   - Summary paragraph
   - City note in a subtle callout box
   - Income timeline: 3 milestone chips (Month 1 / Month 3 / Month 12 targets)

2. **Paths section**
   - Heading: "Your Paths"
   - Render each path as a `RoadmapCard` component
   - The recommended path should be visually highlighted (accent border +
     "Best Match" badge)
   - Sort paths by `fit_score` descending

3. **Encouragement section**
   - Subtle full-width section at the bottom
   - Italic text in a slightly larger size
   - Compass icon

4. **CTA**
   - Button: "Start Over" (clears localStorage, goes back to `/`)

---

### `RoadmapCard.jsx`

Each career path renders as an expandable card.

**Collapsed state shows:**
- Path title
- Fit score (shown as filled dots, e.g. ●●●●●●●○○○ for 7/10)
- Why this fits (1-2 sentences)
- Time to first income + income potential (two small stat chips)
- Effort level badge (Low / Medium / High with color coding)
- "First step today" call-to-action box (accent background, bold)
- Expand button "See full roadmap ↓"

**Expanded state adds:**
- `MilestoneTimeline` component (week-by-week actions)
- Platforms list (name + what to do + link)
- Skill gaps list with `SkillTag` components
- Collapse button

---

### `MilestoneTimeline.jsx`

Renders milestones as a vertical timeline.
- Left side: week number in a circle
- Right side: milestone title + action text
- Use `compass-success` color for the timeline line and dots

---

### `TypingIndicator.jsx`

Three animated dots (CSS keyframe animation). Show in a chat bubble on the
left side while waiting for AI response.

---

### `ProgressBar.jsx`

Thin bar at top of IntakePage. Width = `progress`% from API response.
Color: `compass-accent`. Animate width transitions with `transition-all duration-500`.

---

### `SkillTag.jsx`

Small pill component. Props: `label`, `variant` (gap | skill).
Gap variant: amber background. Skill variant: indigo background.

---

## 9. SESSION MANAGEMENT

`hooks/useSession.js`

```js
// On app load:
// 1. Read compass_session_id from localStorage
// 2. If found, GET /api/session/{id} to check state
// 3. If roadmap already exists, redirect to /roadmap directly
// 4. If session exists but no roadmap, resume chat
// 5. If no session or session not found, generate new UUID and store it
```

---

## 10. ROUTING

Use React Router v6.

```
/ → IntakePage
/roadmap → RoadmapPage (redirect to / if no session_id in localStorage)
```

---

## 11. ENVIRONMENT & CONFIG

### `backend/.env.example`
```
OPENAI_API_KEY=your-key-here
DATABASE_URL=sqlite:///./compass.db
FRONTEND_URL=http://localhost:5173
```

### CORS
In `main.py`, allow `http://localhost:5173` as origin.

### Vite proxy
In `vite.config.js`, proxy `/api` to `http://localhost:8000` so frontend
doesn't need full URL.

---

## 12. REQUIREMENTS FILES

### `backend/requirements.txt`
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
openai==1.30.0
sqlalchemy==2.0.30
pydantic==2.7.1
python-dotenv==1.0.1
aiofiles==23.2.1
```

### `frontend/package.json` dependencies
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.23.0",
  "axios": "^1.7.0",
  "uuid": "^9.0.0"
}
```

Dev dependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`,
`postcss`

---

## 13. README

Generate a `README.md` with:
- One-paragraph product description
- Prerequisites (Node 18+, Python 3.11+)
- Setup instructions (clone, install, .env, run backend, run frontend)
- How to use (open browser, start chatting)
- Architecture overview (2 paragraphs)

---

## 14. ERROR HANDLING REQUIREMENTS

- If OpenAI call fails: return a friendly message in the chat bubble
  ("I'm having trouble connecting right now. Please try again in a moment.")
- If roadmap JSON parsing fails: retry once, then show error page with
  "Something went wrong generating your roadmap. Your conversation is saved."
- All API errors should return structured JSON: `{"error": "message", "code": "ERROR_CODE"}`
- Frontend: catch all Axios errors and show inline error states, never crash

---

## 15. WHAT NOT TO BUILD (MVP SCOPE BOUNDARIES)

Do NOT build any of the following — they are post-MVP:
- User authentication or accounts
- Payment or subscription flow
- Email capture or notifications
- Admin dashboard
- Multiple roadmap versions or history
- PDF export
- Sharing or referral features
- Mobile app
- Any external API beyond OpenAI (no scraping, no job boards)

---

## 16. DONE CRITERIA

The build is complete when:
- [ ] `uvicorn backend.main:app --reload` starts without errors
- [ ] `npm run dev` starts without errors
- [ ] Visiting `localhost:5173` shows the chat interface with an opening message
- [ ] A full conversation leads to a roadmap being generated and displayed
- [ ] Refreshing the roadmap page does not lose the roadmap
- [ ] Starting over (clear button) resets everything cleanly
- [ ] No console errors in normal usage flow

---

*End of SDD. Build everything above.*