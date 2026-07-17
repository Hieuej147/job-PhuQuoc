import json
from typing import cast, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class CreateJobInput(BaseModel):
    title: str = Field(description="Tiêu đề tin tuyển dụng")
    description: str = Field(description="Mô tả công việc chi tiết")
    category_id: str = Field(description="ID danh mục ngành nghề (lấy từ get_categories)")
    type: str = Field(
        description="Loại hình: FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP, FREELANCE"
    )
    experience: Optional[str] = Field(
        default=None,
        description="Kinh nghiệm: NO_EXPERIENCE, UNDER_1_YEAR, ONE_TO_THREE_YEARS, THREE_TO_FIVE_YEARS, OVER_FIVE_YEARS"
    )
    level: Optional[str] = Field(
        default=None,
        description="Cấp bậc: INTERN, FRESHER, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR"
    )
    salary_min: Optional[int] = Field(
        default=None,
        description="Lương tối thiểu (VND). Ví dụ: 8000000"
    )
    salary_max: Optional[int] = Field(
        default=None,
        description="Lương tối đa (VND). Ví dụ: 15000000"
    )
    requirements: Optional[str] = Field(
        default=None,
        description="Yêu cầu ứng viên"
    )
    benefits: Optional[str] = Field(
        default=None,
        description="Quyền lợi và phúc lợi"
    )
    quantity: Optional[int] = Field(
        default=1,
        description="Số lượng tuyển dụng"
    )
    # ĐÃ BỎ field `deadline`: backend KHÔNG nhận deadline khi tạo job (CreateJobDto
    # không có field này — xem tài liệu API). NestJS ValidationPipe({whitelist:true})
    # âm thầm loại bỏ field lạ chứ không báo lỗi, khiến tool trước đây "tưởng" đã
    # lưu deadline thành công nhưng thực ra không hề được set. Deadline CHỈ được
    # backend tự tính sau khi employer thanh toán, theo số ngày của gói đã chọn.


class CreateJobTool(BaseTool):
    name = "create_job"
    description = (
        "Tạo tin tuyển dụng mới ở trạng thái DRAFT. "
        "Dùng SAU KHI đã có category_id từ get_categories và đã xác nhận "
        "đầy đủ thông tin với nhà tuyển dụng. "
        "Job tạo xong ở trạng thái DRAFT — CHƯA hiển thị công khai và CHƯA có hạn "
        "nộp hồ sơ; nhà tuyển dụng cần vào trang thanh toán, chọn gói đăng tin để "
        "kích hoạt job và hệ thống sẽ tự set hạn nộp theo số ngày của gói đó."
    )
    args_schema = CreateJobInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        title: str,
        description: str,
        category_id: str,
        type: str,
        experience: Optional[str] = None,
        level: Optional[str] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        requirements: Optional[str] = None,
        benefits: Optional[str] = None,
        quantity: int = 1,
    ) -> dict:
        try:
            payload = {
                "title": title,
                "description": description,
                "categoryId": category_id,
                "type": type,
                "quantity": quantity,
            }

            if experience:
                payload["experience"] = experience
            if level:
                payload["level"] = level
            if salary_min:
                payload["salaryMin"] = salary_min
            if salary_max:
                payload["salaryMax"] = salary_max
            if requirements:
                payload["requirements"] = requirements
            if benefits:
                payload["benefits"] = benefits

            response = await self.api_client.post("/jobs", json=payload)
            job = response.get("data", response) if isinstance(response, dict) else response

            return {
                "success": True,
                "job_id": job.get("id"),
                "slug": job.get("slug"),
                "title": job.get("title"),
                "status": job.get("status"),
                "message": (
                    f"Đã tạo tin tuyển dụng '{title}' thành công! "
                    f"Trạng thái hiện tại: DRAFT (chưa công khai, chưa có hạn nộp). "
                    f"Vui lòng vào trang thanh toán và chọn gói đăng tin để kích hoạt — "
                    f"hạn nộp hồ sơ sẽ được tự động set theo số ngày của gói đó."
                ),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Không thể tạo tin tuyển dụng. Vui lòng thử lại.",
            }

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang tạo tin tuyển dụng..."
            state["toolStatus"] = "create_job"
            state["progress"] = 70
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run(
                title=args.get("title"),
                description=args.get("description"),
                category_id=args.get("category_id"),
                type=args.get("type"),
                experience=args.get("experience"),
                level=args.get("level"),
                salary_min=args.get("salary_min"),
                salary_max=args.get("salary_max"),
                requirements=args.get("requirements"),
                benefits=args.get("benefits"),
                quantity=args.get("quantity", 1),
            )

            has_error = not result.get("success", False)
            state["status"] = "error" if has_error else "done"
            state["currentStep"] = "Không thể tạo tin tuyển dụng." if has_error else "Đã tạo tin tuyển dụng thành công."
            state["progress"] = 100
            state["messages"] = [
                ToolMessage(
                    tool_call_id=tool_call_id,
                    name=tool_call["name"],
                    content=json.dumps(result, ensure_ascii=False),
                )
            ]
            await copilotkit_emit_state(config, state)
            return state

        node.__name__ = "create_job_node"
        return node