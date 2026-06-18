from copilotkit import CopilotKitState
from pydantic import Field
from typing import Optional, List, Any, Dict


class CandidateBaseState(CopilotKitState):
    # Auth
    authorization: Optional[Dict[str, Any]] = None

    # Worker progress shared with frontend
    activeWorker: Optional[str] = None
    currentStep: str = ""
    status: str = "idle"  # idle, thinking, running, waiting_user, done, error
    toolStatus: Optional[str] = None
    progress: int = 0
    step: str = ""


class CandidateState(CandidateBaseState):
    activeWorker: Optional[str] = None
    job_search: Optional[Dict[str, Any]] = None
    dashboard_analysis: Optional[Dict[str, Any]] = None
    cv_flow: str = "idle"  # idle, collecting, generating, preview, editing, done, error

    # User info collected during conversation
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_address: Optional[str] = None
    user_summary: Optional[str] = None
    user_skills: List[str] = Field(default_factory=list)
    user_education: List[Dict[str, Any]] = Field(default_factory=list)
    user_experience: List[Dict[str, Any]] = Field(default_factory=list)
    user_projects: List[Dict[str, Any]] = Field(default_factory=list)
    user_languages: List[str] = Field(default_factory=list)

    # Template preview synced to FE state
    current_template_name: Optional[str] = None
    current_template_html: Optional[str] = None
    current_template_css: Optional[str] = None
