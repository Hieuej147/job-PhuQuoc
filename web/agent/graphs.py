from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from core.agent_factory import create_candidate_graph, create_recruiter_graph

candidate_graph = create_candidate_graph()
recruiter_graph = create_recruiter_graph()
