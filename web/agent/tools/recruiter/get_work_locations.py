import json
from typing import cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from core.api_client import ApiClient
from tools.base_tool import BaseTool


class GetWorkLocationsInput(BaseModel):
    pass


class GetWorkLocationsTool(BaseTool):
    name = "get_work_locations"
    description = (
        "Lấy danh sách khu vực/phường/xã làm việc tại Phú Quốc. "
        "Dùng TRƯỚC khi tạo tin tuyển dụng để lấy ward_id hợp lệ."
    )
    args_schema = GetWorkLocationsInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(self) -> dict:
        try:
            response = await self.api_client.get("/address/wards")
            items = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(items, dict):
                items = items.get("items", [])
            if not isinstance(items, list):
                items = []

            return {
                "locations": [
                    {
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "slug": item.get("slug"),
                        "district": (item.get("district") or {}).get("name"),
                        "province": ((item.get("district") or {}).get("province") or {}).get("name"),
                    }
                    for item in items
                ],
                "total": len(items),
            }
        except Exception as e:
            return {"error": str(e), "locations": [], "total": 0}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang lấy khu vực làm việc..."
            state["toolStatus"] = "get_work_locations"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run()

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = (
                "Đã lấy xong khu vực làm việc."
                if not result.get("error")
                else "Không thể lấy khu vực làm việc."
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

        node.__name__ = "get_work_locations_node"
        return node
