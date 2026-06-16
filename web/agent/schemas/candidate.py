from copilotkit import CopilotKitState
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


class CandidateJobState(CandidateBaseState):
    activeWorker: Optional[str] = "job_searcher"
    job_search: Optional[Dict[str, Any]] = None


class CandidateAdvisorState(CandidateBaseState):
    activeWorker: Optional[str] = "career_advisor"
    dashboard_analysis: Optional[Dict[str, Any]] = None


class CandidateCvState(CandidateBaseState):
    activeWorker: Optional[str] = "cv_designer"
    cv_flow: str = "idle"  # idle, collecting, generating, preview, editing, done, error

    # User info collected during conversation
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_address: Optional[str] = None
    user_summary: Optional[str] = None
    user_skills: List[str] = []
    user_education: List[Dict[str, Any]] = []
    user_experience: List[Dict[str, Any]] = []
    user_projects: List[Dict[str, Any]] = []
    user_languages: List[str] = []

    # Template preview synced to FE state
    current_template_name: Optional[str] = None
    current_template_html: Optional[str] = None
    current_template_css: Optional[str] = None


# Compatibility alias for old imports. /candidate now points to advisor.
CandidateState = CandidateAdvisorState
