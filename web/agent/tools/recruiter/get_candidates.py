import json
from typing import cast, Optional, Any

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from tools.base_tool import BaseTool
from core.api_client import ApiClient


def _unwrap_items(response: Any) -> list:
    """
    Bóc tách các lớp {"data": {...}} lồng nhau (kể cả nhiều lớp) cho tới khi tìm
    được 1 list, hoặc 1 dict phân trang chuẩn {items, total, page, limit}.
    Trước đây code cũ dùng response.get("items", []) trực tiếp trên response gốc
    dạng {"data": {"items": [...]}, "timestamp": ...} — "items" nằm bên TRONG
    "data", nên luôn trả về [] dù có ứng viên thật. Đây là lỗi giống hệt đã gặp
    và sửa ở list_my_cvs.py (candidate).
    """
    current = response
    for _ in range(5):
        if isinstance(current, list):
            return current
        if isinstance(current, dict):
            if isinstance(current.get("items"), list):
                return current["items"]
            if "data" in current:
                current = current["data"]
                continue
        break
    return []


class GetCandidatesInput(BaseModel):
    job_id: str = Field(description="ID của job muốn xem ứng viên")
    status: Optional[str] = Field(default=None, description="Lọc theo trạng thái: PENDING, ACCEPTED, REJECTED")
    limit: int = Field(default=20, description="Số lượng kết quả")


class GetCandidatesTool(BaseTool):
    name = "get_candidates"
    description = (
        "Xem danh sách ứng viên đã nộp đơn cho một job cụ thể. "
        "Dùng khi nhà tuyển dụng muốn xem ai đã apply. "
        "Nếu kết quả trả về rỗng (candidates=[]), TUYỆT ĐỐI KHÔNG gọi lại tool này với "
        "job_id/status y hệt lần trước — dừng lại ngay và báo cho nhà tuyển dụng biết "
        "không tìm thấy ứng viên khớp điều kiện, rồi hỏi họ kiểm tra lại job_id hoặc "
        "bỏ bớt điều kiện lọc status."
    )
    args_schema = GetCandidatesInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        job_id: str,
        status: Optional[str] = None,
        limit: int = 20,
    ) -> dict:
        try:
            params = {"limit": limit}
            response = await self.api_client.get(
                f"/applications/job/{job_id}",
                params=params,
            )
            items = _unwrap_items(response)

            # Filter by status if provided
            if status:
                items = [a for a in items if a.get("status") == status]

            candidates = [
                {
                    "application_id": a.get("id"),
                    "user_name": a.get("user", {}).get("name"),
                    "user_email": a.get("user", {}).get("email"),
                    "status": a.get("status"),
                    "applied_at": a.get("createdAt"),
                    "cover_letter": a.get("coverLetter"),
                }
                for a in items
                if isinstance(a, dict)
            ]

            result: dict = {"candidates": candidates, "total": len(candidates)}

            # QUAN TRỌNG: khi rỗng, tự chèn ghi chú hướng dẫn NGAY TRONG kết quả
            # trả về (không chỉ dựa vào system prompt) — vì đây là tín hiệu LLM
            # nhìn thấy trực tiếp mỗi lần gọi tool, đáng tin cậy hơn nhiều so với
            # việc trông chờ LLM tự nhớ 1 quy tắc nằm cách đó rất xa trong system
            # prompt. Từng gặp trường hợp thực tế: LLM lặp lại y hệt job_id/status
            # nhiều chục lần liên tiếp vì kết quả rỗng "trông như thành công" và
            # không có tín hiệu nào bảo nó dừng lại.
            if not candidates:
                result["note"] = (
                    "Không tìm thấy ứng viên nào khớp job_id/status đã lọc. KHÔNG gọi "
                    "lại get_candidates với đúng job_id và status này thêm lần nào nữa "
                    "trong lượt trả lời này — hãy dừng lại và hỏi lại nhà tuyển dụng."
                )

            return result
        except Exception as e:
            return {
                "error": str(e),
                "candidates": [],
                "total": 0,
                "note": "Đã có lỗi khi gọi API. KHÔNG tự động gọi lại tool này — hãy báo lỗi cho nhà tuyển dụng.",
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
            state["currentStep"] = "Đang lấy danh sách ứng viên..."
            state["toolStatus"] = "get_candidates"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run(
                job_id=args.get("job_id"),
                status=args.get("status"),
                limit=args.get("limit", 20),
            )

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = (
                "Đã lấy xong danh sách ứng viên." if not result.get("error") else "Không thể lấy danh sách ứng viên."
            )
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

        node.__name__ = "get_candidates_node"
        return node