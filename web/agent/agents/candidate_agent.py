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
from tools.candidate.choose_cv_template import ChooseCvTemplateTool
from tools.candidate.save_cv import SaveCvTool
from tools.shared.create_blog_post import CreateBlogPostTool


class CandidateAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext, checkpointer=None):
        api_client = ApiClient()
        super().__init__(llm, context, api_client, checkpointer)

    def _register_tools(self) -> list:
        return [
            CareerAdvisorTool(),
            SearchJobsTool(api_client=self.api_client),
            ListMyCvsTool(api_client=self.api_client),
            GetCvDetailTool(api_client=self.api_client),
            ChooseCvTemplateTool(api_client=self.api_client),
            SaveCvTool(api_client=self.api_client),
            CreateBlogPostTool(api_client=self.api_client),
        ]

    # ASYNC để khớp interface mới của BaseAgent (xem base_agent.py — system
    # prompt giờ được tính lại mỗi lượt chat thay vì 1 lần cố định lúc khởi
    # động, vì self.context là dữ liệu tĩnh dùng chung cho MỌI candidate, xem
    # core/agent_factory.py::create_candidate_graph). CandidateAgent hiện chưa
    # tự fetch thêm gì qua API (skills/experience_years vẫn lấy từ
    # self.context, hiện luôn rỗng do agent_factory chưa set) — cùng loại vấn
    # đề như company_name từng bị ở RecruiterAgent, nhưng CHƯA gây lỗi quan sát
    # được trong thực tế (candidate tools tự hỏi user trực tiếp thông tin cần
    # thiết thay vì dựa vào context), nên chưa mở rộng fetch ở đây — có thể bổ
    # sung sau nếu cần cá nhân hóa system prompt theo hồ sơ thật.
    async def _get_system_prompt(self, state) -> str:
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
            "choose_cv_template": "choose_cv_template_node",
            "save_cv": "save_cv_node",
            "create_blog_post": "create_blog_post_node",
        }

    def _add_custom_nodes(self, workflow):
        for tool in self.tools:
            if hasattr(tool, "as_node"):
                node = tool.as_node()
                workflow.add_node(node.__name__, node)