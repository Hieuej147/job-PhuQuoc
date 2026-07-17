import json
from typing import cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from typing import Literal
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class UpdateApplicationStatusInput(BaseModel):
    application_id: str = Field(description="ID của đơn ứng tuyển")
    # Lưu ý: PENDING không phải trạng thái đích hợp lệ trong state machine thật
    # (PENDING chỉ là trạng thái khởi tạo, không thể "chuyển về" PENDING từ trạng
    # thái khác — xem Application Status Machine trong tài liệu backend). Vẫn giữ
    # trong Literal để không đổi contract hiện có; nếu AI lỡ chọn PENDING, backend
    # sẽ từ chối và tool trả success=False, không gây crash.
    status: Literal["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"] = Field(
        description="Trạng thái mới: REVIEWING, ACCEPTED, REJECTED (PENDING là trạng thái khởi tạo, không dùng làm đích)"
    )


class UpdateApplicationStatusTool(BaseTool):
    name = "update_application_status"
    description = (
        "Cập nhật trạng thái đơn ứng tuyển. "
        "Dùng khi nhà tuyển dụng muốn duyệt hoặc từ chối ứng viên."
    )
    args_schema = UpdateApplicationStatusInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(self, application_id: str, status: str) -> dict:
        try:
            await self.api_client.patch(
                f"/applications/{application_id}/status",
                json={"status": status},
            )
            return {
                "success": True,
                "application_id": application_id,
                "new_status": status,
                "message": f"Đã cập nhật trạng thái thành {status}",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang cập nhật trạng thái đơn ứng tuyển..."
            state["toolStatus"] = "update_application_status"
            state["progress"] = 70
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run(
                application_id=args.get("application_id"),
                status=args.get("status"),
            )

            has_error = not result.get("success", False)
            state["status"] = "error" if has_error else "done"
            state["currentStep"] = "Không thể cập nhật trạng thái." if has_error else "Đã cập nhật trạng thái thành công."
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

        node.__name__ = "update_application_status_node"
        return node