import json
from typing import cast, Optional, Any

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from tools.base_tool import BaseTool
from core.api_client import ApiClient
from tools.candidate.resume_helpers import summarize_resume, unwrap_data, unwrap_list


def _unwrap_items(response: Any) -> list:
    """
    Boc tach cac lop {"data": {...}} long nhau (ke ca long NHIEU lop) cho toi khi
    tim duoc 1 list, hoac 1 dict phan trang chuan {items, total, page, limit}.

    Backend NestJS (module resumes) doi khi tra response boc 2 lop "data" -
    save_cv.py da phai xu ly y het van de nay cho /resumes/:id (xem unwrap_data()
    o do). Neu chi boc 1 lop nhu code cu, voi response dang
    {"data": {"data": [...]}, "timestamp": ...}, ket qua sau khi boc 1 lop van la
    {"data": [...]} - 1 dict KHONG co key "items" - khien ham luon tra ve []
    bat ke user co CV that hay khong. Day la nguyen nhan list_my_cvs luon bao
    "chua co CV nao" du save_cv vua tao/cap nhat CV thanh cong.
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


class ListMyCvsInput(BaseModel):
    pass


class ListMyCvsTool(BaseTool):
    name = "list_my_cvs"
    description = (
        "Lấy danh sách các CV mà candidate đã tạo và lưu trước đó. "
        "Dùng khi user muốn xem lại, chỉnh sửa hoặc hỏi về CV đã có của mình, "
        "và AI chưa biết chính xác resume_id nào tương ứng."
    )
    args_schema = ListMyCvsInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(self) -> dict:
        try:
            cvs_response = await self.api_client.get("/resumes/my")
            profile_response = await self.api_client.get("/resumes/profile")
            items = unwrap_list(cvs_response)
            profile = unwrap_data(profile_response)
            profile_summary = summarize_resume(profile, "profile")
            cvs = [
                summary
                for summary in (summarize_resume(cv, "created_cv") for cv in items)
                if summary is not None
            ]

            return {
                "profile": profile_summary,
                "cvs": cvs,
                "hasProfile": profile_summary is not None,
                "totalCreatedCvs": len(cvs),
                "hasAnyCvLikeData": len(cvs) > 0 or bool(profile_summary and profile_summary.get("hasContent")),
            }
        except Exception as e:
            return {
                "error": str(e),
                "message": "Không thể kiểm tra danh sách CV lúc này. Đây là lỗi kết nối/xác thực, không có nghĩa là bạn chưa có CV.",
                "profile": None,
                "cvs": [],
                "hasProfile": False,
                "totalCreatedCvs": 0,
                "hasAnyCvLikeData": False,
            }

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]

            state["activeWorker"] = "cv_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang lấy danh sách CV của bạn..."
            state["toolStatus"] = "list_my_cvs"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            # Đồng bộ cookie/token từ state["authorization"] lên api_client ngay
            # trước khi gọi run() — xem giải thích trong BaseTool.sync_auth_from_state().
            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run()

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = "Đã lấy xong danh sách CV." if not result.get("error") else "Không thể lấy danh sách CV."
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

        node.__name__ = "list_my_cvs_node"
        return node
