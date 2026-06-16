from langchain_openai import ChatOpenAI
from core.config import get_settings
from core.context import AgentContext
from agents.candidate_agent import CandidateAdvisorAgent, CandidateCvAgent, CandidateJobAgent
from agents.recruiter_agent import RecruiterAgent


def _llm():
    settings = get_settings()
    return ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key)


def _candidate_context():
    return AgentContext(
        user_id="default",
        user_name="Candidate",
        role="candidate",
    )


def create_candidate_job_graph():
    return CandidateJobAgent(llm=_llm(), context=_candidate_context()).graph


def create_candidate_cv_graph():
    return CandidateCvAgent(llm=_llm(), context=_candidate_context()).graph


def create_candidate_advisor_graph():
    return CandidateAdvisorAgent(llm=_llm(), context=_candidate_context()).graph


def create_candidate_graph():
    """Compatibility alias: old /candidate now behaves as advisor."""
    return create_candidate_advisor_graph()


def create_recruiter_graph():
    settings = get_settings()
    llm = ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key)
    context = AgentContext(
        user_id="default",
        user_name="Recruiter",
        role="recruiter",
    )
    return RecruiterAgent(llm=llm, context=context).graph
