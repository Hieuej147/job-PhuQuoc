from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from core.agent_factory import (
    create_candidate_advisor_graph,
    create_candidate_cv_graph,
    create_candidate_graph,
    create_candidate_job_graph,
    create_recruiter_graph,
)

candidate_graph = create_candidate_graph()
candidate_job_graph = create_candidate_job_graph()
candidate_cv_graph = create_candidate_cv_graph()
candidate_advisor_graph = create_candidate_advisor_graph()
recruiter_graph = create_recruiter_graph()
