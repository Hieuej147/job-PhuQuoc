from langchain_core.language_models import BaseChatModel
from agents.base_agent import BaseAgent
from schemas.recruiter import RecruiterState
from core.context import AgentContext
from core.prompts import RECRUITER_SYSTEM_PROMPT
from core.api_client import ApiClient
from tools.recruiter.get_candidates import GetCandidatesTool
from tools.recruiter.rank_candidates import RankCandidatesTool
from tools.recruiter.update_application_status import UpdateApplicationStatusTool
from tools.recruiter.draft_email import DraftEmailTool
from tools.recruiter.get_categories import GetCategoriesTool   # thêm
from tools.recruiter.create_job import CreateJobTool           # thêm


class RecruiterAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext):
        api_client = ApiClient()
        super().__init__(llm, context, api_client)

    def _register_tools(self) -> list:
        return [
            GetCandidatesTool(api_client=self.api_client),
            RankCandidatesTool(api_client=self.api_client),
            UpdateApplicationStatusTool(api_client=self.api_client),
            DraftEmailTool(),
            GetCategoriesTool(api_client=self.api_client),  # thêm
            CreateJobTool(api_client=self.api_client),      # thêm
        ]

    def _get_system_prompt(self) -> str:
        return RECRUITER_SYSTEM_PROMPT.format(
            user_id=self.context.user_id,
            user_name=self.context.user_name,
            company_name=self.context.company_name or "Chưa rõ",
            active_job_ids=", ".join(self.context.active_job_ids or []),
        )

    def _get_state_class(self) -> type:
        return RecruiterState