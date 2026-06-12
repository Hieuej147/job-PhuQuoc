import logging
from typing import Any
from langchain_core.language_models import BaseChatModel
from agents.base_agent import BaseAgent
from schemas.candidate import CandidateState
from core.context import AgentContext
from core.prompts import CANDIDATE_SYSTEM_PROMPT
from core.api_client import ApiClient
from tools.candidate.career_advisor import CareerAdvisorTool
from tools.candidate.search_jobs import SearchJobsTool
from tools.candidate.cv_tools import GenerateCVTemplateTool, AdjustCVTemplateTool, SaveResumeTool

logger = logging.getLogger(__name__)


class CandidateAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext):
        api_client = ApiClient()
        super().__init__(llm, context, api_client)

    def _register_tools(self) -> list:
        gen_tool = GenerateCVTemplateTool()
        gen_tool.api_client = self.api_client
        gen_tool.llm = self.llm

        adj_tool = AdjustCVTemplateTool()
        adj_tool.llm = self.llm

        save_tool = SaveResumeTool()
        save_tool.api_client = self.api_client
        save_tool.llm = self.llm

        return [
            CareerAdvisorTool(),
            SearchJobsTool(api_client=self.api_client),
            gen_tool,
            adj_tool,
            save_tool,
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
        """Candidate tools use custom nodes so they can emit worker progress."""
        return []

    def _get_routing_map(self) -> dict:
        return {
            "analyze_candidate_dashboard": "career_advisor_node",
            "search_jobs": "job_searcher_node",
            "generate_cv_template": "generate_template_node",
            "adjust_cv_template": "adjust_template_node",
            "save_resume": "save_resume_node",
        }

    def _add_custom_nodes(self, workflow):
        for t in self.tools:
            node_name = self._get_routing_map().get(t.name)
            if node_name and hasattr(t, "as_node"):
                workflow.add_node(node_name, t.as_node())
