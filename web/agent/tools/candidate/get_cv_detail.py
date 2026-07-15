import json
from typing import cast, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool
from core.api_client import ApiClient


def unwrap_data(response):
    """Bóc tách các lớp {"data": {...}} lồng nhau mà backend đôi khi trả về."""
    result = response
    while isinstance(result, dict) and "id" not in result and "data" in result:
        result = result["data"]
    return result


class GetCvDetailInput(BaseModel):
    resume_id: Optional[str] = Field(default=None, description="ID chính xác của CV nếu đã biết")
    title_hint: Optional[str] = Field(
        default=None,
        description="Tên hoặc từ khóa gần đúng của CV, dùng để tìm khi chưa biết resume_id (ví dụ: 'Frontend Developer')",
    )


class GetCvDetailTool(BaseTool):
    name = "get_cv_detail"
    description = (
        "Lấy toàn bộ nội dung chi tiết của một CV cụ thể đã lưu (thông tin, học vấn, kinh nghiệm, kỹ năng...). "
        "Dùng trước khi sửa CV để biết dữ liệu hiện tại, hoặc khi user hỏi lại nội dung CV đã tạo. "
        "Nếu chưa biết resume_id, truyền title_hint để tool tự tìm theo tên gần đúng."
    )
    args_schema = GetCvDetailInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def _resolve_resume_id(self, resume_id: Optional[str], title_hint: Optional[str]) -> dict:
        if resume_id:
            return {"id": resume_id}

        response = await self.api_client.get("/resumes/my")
        items = response.get("data", response) if isinstance(response, dict) else response
        if isinstance(items, dict):
            items = items.get("items", [])
        if not isinstance(items, list):
            items = []

        if not items:
            return {"error": "Bạn chưa có CV nào được lưu."}

        if title_hint:
            keyword = title_hint.strip().lower()
            matches = [cv for cv in items if keyword in (cv.get("title") or "").lower()]
            if len(matches) == 1:
                return {"id": matches[0]["id"]}
            if len(matches) > 1:
                return {
                    "error": "Có nhiều CV trùng khớp từ khóa, cần xác nhận rõ hơn.",
                    "candidates": [{"id": cv["id"], "title": cv["title"]} for cv in matches],
                }
            return {
                "error": f"Không tìm thấy CV nào khớp với '{title_hint}'.",
                "candidates": [{"id": cv["id"], "title": cv["title"]} for cv in items],
            }

        if len(items) == 1:
            return {"id": items[0]["id"]}

        return {
            "error": "Bạn có nhiều CV, cần biết rõ muốn xem CV nào.",
            "candidates": [{"id": cv["id"], "title": cv["title"]} for cv in items],
        }

    async def run(self, resume_id: Optional[str] = None, title_hint: Optional[str] = None) -> dict:
        try:
            resolved = await self._resolve_resume_id(resume_id, title_hint)
            if resolved.get("error"):
                return resolved

            resume = await self.api_client.get(f"/resumes/{resolved['id']}")
            data = unwrap_data(resume)
            return {"resume": data}
        except Exception as e:
            return {"error": str(e)}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "cv_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang lấy nội dung CV..."
            state["toolStatus"] = "get_cv_detail"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            result = await tool_instance.run(
                resume_id=args.get("resume_id"),
                title_hint=args.get("title_hint"),
            )

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = "Đã lấy xong nội dung CV." if not result.get("error") else "Không lấy được CV."
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

        node.__name__ = "get_cv_detail_node"
        return node