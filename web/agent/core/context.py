from pydantic import BaseModel
from typing import Optional


class AgentContext(BaseModel):
    user_id: str
    user_name: str
    role: str  # "candidate" | "recruiter"

    # Candidate context
    skills: Optional[list[str]] = None
    experience_years: Optional[int] = None
    current_cv_id: Optional[str] = None

    # Recruiter context
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    active_job_ids: Optional[list[str]] = None
