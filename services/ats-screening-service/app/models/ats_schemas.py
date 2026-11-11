from pydantic import BaseModel, Field
from typing import List, Optional

class ATSScoreResult(BaseModel):
    ats_score: float = Field(..., description="Calculated matching score between 0 and 100")
    is_fit: bool = Field(..., description="True if ats_score >= minimum job threshold, else False")
    matched_skills: List[str] = Field(default=[], description="Skills successfully matched against Job Description")
    missing_skills: List[str] = Field(default=[], description="Key required skills missing from candidate CV")
    summary: str = Field(..., description="Concise qualitative assessment summary")

class CandidateEvaluateResponse(BaseModel):
    status: str
    message: str
    candidate_id: Optional[str] = None
    ats_score: float
    saved_to_db: bool
    matched_skills: List[str] = []
    missing_skills: List[str] = []
