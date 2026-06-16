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
from core.agent_factory import (
    create_candidate_advisor_graph,
    create_candidate_cv_graph,
    create_candidate_graph,
    create_candidate_job_graph,
    create_recruiter_graph,
)
from core.config import get_settings

app = FastAPI(title="Phú Quốc Jobs AI Agents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

candidate_graph = create_candidate_graph()
candidate_job_graph = create_candidate_job_graph()
candidate_cv_graph = create_candidate_cv_graph()
candidate_advisor_graph = create_candidate_advisor_graph()
recruiter_graph = create_recruiter_graph()

add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="candidate_agent",
        description="AI trợ lý candidate mặc định, alias về advisor",
        graph=candidate_graph,
    ),
    path="/candidate",
)

add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="candidate_job_agent",
        description="AI tìm việc cho ứng viên",
        graph=candidate_job_graph,
    ),
    path="/candidate/job",
)

add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="candidate_cv_agent",
        description="AI thiết kế CV cho ứng viên qua MCP server",
        graph=candidate_cv_graph,
    ),
    path="/candidate/cv",
)

add_langgraph_fastapi_endpoint(
    app=app,
    agent=CustomLangGraphAGUIAgent(
        name="candidate_advisor_agent",
        description="AI tư vấn dashboard cho ứng viên",
        graph=candidate_advisor_graph,
    ),
    path="/candidate/advisor",
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
        "agents": [
            "candidate_agent",
            "candidate_job_agent",
            "candidate_cv_agent",
            "candidate_advisor_agent",
            "recruiter_agent",
        ],
    }


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.agent_port)
