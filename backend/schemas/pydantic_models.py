from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    intake_complete: bool
    progress: int


class RoadmapGenerateRequest(BaseModel):
    session_id: str


class SessionStatusResponse(BaseModel):
    exists: bool
    intake_complete: bool
    roadmap_ready: bool


class MilestoneSchema(BaseModel):
    week: int
    title: str
    action: str


class PlatformSchema(BaseModel):
    name: str
    url: str
    what_to_do: str


class CareerPathSchema(BaseModel):
    id: str
    title: str
    fit_score: int
    why_this_fits: str
    time_to_first_income: str
    income_potential: str
    effort_level: str
    milestones: List[MilestoneSchema]
    platforms: List[PlatformSchema]
    skill_gaps: List[str]
    first_step_today: str


class IncomeTimelineSchema(BaseModel):
    month_1_target: str
    month_3_target: str
    month_12_target: str
    note: str


class RoadmapOutputSchema(BaseModel):
    title: str
    summary: str
    city_note: str
    income_timeline: IncomeTimelineSchema
    paths: List[CareerPathSchema]
    recommended_path_id: str
    encouragement: str
