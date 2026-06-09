import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env from web/ directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from agents.custom_agent import CustomLangGraphAGUIAgent
from core.agent_factory import create_candidate_graph, create_recruiter_graph
from core.config import get_settings

app = FastAPI(title="Phú Quốc Jobs AI Agents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create agents via factory
candidate_graph = create_candidate_graph()
recruiter_graph = create_recruiter_graph()

# Register with CopilotKit
add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="candidate_agent",
        description="AI trợ lý tìm việc cho ứng viên",
        graph=candidate_graph,
    ),
    path="/candidate",
)

add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="recruiter_agent",
        description="AI trợ lý tuyển dụng cho nhà tuyển dụng",
        graph=recruiter_graph,
    ),
    path="/recruiter",
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agents": ["candidate_agent", "recruiter_agent"],
    }


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.agent_port)
