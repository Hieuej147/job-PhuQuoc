from langchain_core.language_models import BaseChatModel
from agents.base_agent import BaseAgent
from core.api_client import ApiClient
from core.context import AgentContext
from core.prompts import CANDIDATE_SYSTEM_PROMPT
from schemas.candidate import CandidateState
from tools.candidate.career_advisor import CareerAdvisorTool
from tools.candidate.search_jobs import SearchJobsTool
from tools.candidate.list_my_cvs import ListMyCvsTool
from tools.candidate.get_cv_detail import GetCvDetailTool
from tools.candidate.save_cv import SaveCvTool


class CandidateAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext):
        api_client = ApiClient()
        super().__init__(llm, context, api_client)

    def _register_tools(self) -> list:
        return [
            CareerAdvisorTool(),
            SearchJobsTool(api_client=self.api_client),
            ListMyCvsTool(api_client=self.api_client),
            GetCvDetailTool(api_client=self.api_client),
            SaveCvTool(api_client=self.api_client),
        ]

    def _get_system_prompt(self) -> str:
        return CANDIDATE_SYSTEM_PROMPT.format(
            user_id=self.context.user_id,
            user_name=self.context.user_name,
            skills=", ".join(self.context.skills or []),
            experience_years=self.context.experience_years or "Chưa rõ",
        )

    def _get_state_class(self) -> type:
        return CandidateState

    def _get_lc_tools_for_toolnode(self) -> list:
        return []

    def _get_routing_map(self) -> dict:
        return {
            "analyze_candidate_dashboard": "career_advisor_node",
            "search_jobs": "job_searcher_node",
            "list_my_cvs": "list_my_cvs_node",
            "get_cv_detail": "get_cv_detail_node",
            "save_cv": "save_cv_node",
        }

    def _add_custom_nodes(self, workflow):
        for tool in self.tools:
            if hasattr(tool, "as_node"):
                node = tool.as_node()
                workflow.add_node(node.__name__, node)