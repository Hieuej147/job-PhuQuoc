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
from tools.recruiter.get_categories import GetCategoriesTool
from tools.recruiter.get_work_locations import GetWorkLocationsTool
from tools.recruiter.create_job import CreateJobTool
from tools.shared.create_blog_post import CreateBlogPostTool


class RecruiterAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext, checkpointer=None):
        api_client = ApiClient()
        super().__init__(llm, context, api_client, checkpointer)

    def _register_tools(self) -> list:
        # LƯU Ý: send_email KHÔNG còn là backend tool ở đây. LangGraph (FastAPI)
        # không hỗ trợ interrupt() graph-paused, nên cơ chế "chờ xác nhận thật"
        # trước khi gửi email được implement bằng useHumanInTheLoop hoàn toàn ở
        # frontend (web/src/components/ai/renderers/job-tools-renderer.tsx) —
        # tool "send_email" được đăng ký ở client, LLM gọi nó như tool bình
        # thường, nhưng CopilotKit route qua 1 card xác nhận (nút bấm thật) rồi
        # mới thực sự gọi POST /email-integration/send từ trình duyệt. Xem thêm
        # comment trong file renderer đó.
        return [
            GetCandidatesTool(api_client=self.api_client),
            RankCandidatesTool(api_client=self.api_client),
            UpdateApplicationStatusTool(api_client=self.api_client),
            DraftEmailTool(),
            GetCategoriesTool(api_client=self.api_client),
            GetWorkLocationsTool(api_client=self.api_client),
            CreateJobTool(api_client=self.api_client),
            CreateBlogPostTool(api_client=self.api_client),
        ]

    async def _get_system_prompt(self, state) -> str:
        company_name = self.context.company_name or "Chưa rõ"
        active_job_ids = self.context.active_job_ids or []

        # self.context được set 1 lần cố định lúc server khởi động (xem
        # core/agent_factory.py::create_recruiter_graph — chỉ tạo ĐÚNG 1 graph
        # instance dùng chung cho MỌI nhà tuyển dụng), nên self.context.company_name
        # KHÔNG bao giờ đúng cho user thật đang chat. Phải tự fetch dữ liệu tươi
        # qua API mỗi lượt, dùng cookie thật vừa được re-sync trong chat_node
        # (base_agent.py) ngay trước khi gọi hàm này.
        if self.api_client:
            try:
                company_response = await self.api_client.get("/companies/my")
                company_data = (
                    company_response.get("data", company_response)
                    if isinstance(company_response, dict)
                    else company_response
                )
                if isinstance(company_data, dict) and company_data.get("name"):
                    company_name = company_data["name"]
            except Exception:
                pass  # Chưa tạo công ty / lỗi mạng tạm thời -> giữ fallback "Chưa rõ"

            try:
                jobs_response = await self.api_client.get(
                    "/jobs/my", params={"status": "ACTIVE", "limit": 50}
                )
                print("DEBUG jobs_response type:", type(jobs_response))
                print("DEBUG jobs_response:", jobs_response)
                jobs_data = (
                    jobs_response.get("data", jobs_response)
                    if isinstance(jobs_response, dict)
                    else jobs_response
                )
                items = jobs_data.get("items", []) if isinstance(jobs_data, dict) else []
                print("DEBUG items count:", len(items))
                fetched_jobs = [
                    {"id": j.get("id"), "title": j.get("title", "Chưa rõ tiêu đề")}
                    for j in items
                    if isinstance(j, dict) and j.get("id")
                ]
                print("DEBUG fetched_jobs count:", len(fetched_jobs))
                if fetched_jobs:
                    active_job_ids = fetched_jobs
            except Exception as e:
                print("DEBUG jobs fetch exception:", repr(e))
                pass  # Giữ nguyên active_job_ids cũ (rỗng) nếu lỗi

        if active_job_ids and isinstance(active_job_ids[0], dict):
            active_jobs_text = "\n".join(
                f"- {job['title']} (job_id: {job['id']})" for job in active_job_ids
            )
        else:
            active_jobs_text = "Chưa có tin tuyển dụng nào đang hoạt động."

        return RECRUITER_SYSTEM_PROMPT.format(
            user_id=self.context.user_id,
            user_name=self.context.user_name,
            company_name=company_name,
            active_job_ids=active_jobs_text,
        )

    def _get_state_class(self) -> type:
        return RecruiterState
    # Giống CandidateAgent: bắt buộc MỌI tool BACKEND đi qua custom node
    # (as_node) thay vì ToolNode chuẩn của LangChain. Lý do: ToolNode chuẩn chỉ
    # truyền đúng tham số theo args_schema cho run(), KHÔNG có state/config —
    # khiến tool không có cách nào tự đồng bộ cookie đúng của request đang chạy
    # (self.api_client là 1 instance dùng CHUNG cho mọi request/user — xem chi
    # tiết trong base_tool.py::sync_auth_from_state). Trả về [] ở đây tắt hẳn
    # đường ToolNode chuẩn, buộc mọi tool BACKEND phải định nghĩa as_node() và
    # được route qua _get_routing_map() bên dưới. send_email không nằm trong
    # danh sách này vì nó không còn là backend tool.
    def _get_lc_tools_for_toolnode(self) -> list:
        return []

    def _get_routing_map(self) -> dict:
        return {
            "get_candidates": "get_candidates_node",
            "rank_candidates": "rank_candidates_node",
            "update_application_status": "update_application_status_node",
            "draft_email": "draft_email_node",
            "get_categories": "get_categories_node",
            "get_work_locations": "get_work_locations_node",
            "create_job": "create_job_node",
            "create_blog_post": "create_blog_post_node",
        }

    # QUAN TRỌNG: _get_routing_map() ở trên chỉ khai báo "tên tool -> tên node
    # cần đi tới", nhưng KHÔNG tự đăng ký node đó vào graph. Phải override
    # _add_custom_nodes() (mặc định ở BaseAgent chỉ là `pass`, không làm gì) để
    # thật sự gọi workflow.add_node(...) cho từng tool có as_node() — thiếu bước
    # này khiến LangGraph.compile() báo lỗi "Found edge starting at unknown node"
    # vì routing map trỏ tới node chưa từng được tạo. Giống hệt cách
    # CandidateAgent đã làm.
    def _add_custom_nodes(self, workflow):
        for tool in self.tools:
            if hasattr(tool, "as_node"):
                node = tool.as_node()
                workflow.add_node(node.__name__, node)
