import json
from typing import cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from tools.base_tool import BaseTool
from core.api_client import ApiClient


class GetCategoriesInput(BaseModel):
    pass  # Không cần tham số, lấy toàn bộ danh mục


class GetCategoriesTool(BaseTool):
    name = "get_categories"
    description = (
        "Lấy danh sách danh mục ngành nghề từ hệ thống. "
        "Dùng TRƯỚC khi tạo tin tuyển dụng để lấy category_id hợp lệ. "
        "Kết quả trả về danh sách các danh mục kèm ID và tên."
    )
    args_schema = GetCategoriesInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(self) -> dict:
        try:
            response = await self.api_client.get("/categories")
            items = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(items, dict):
                items = items.get("items", [])

            return {
                "categories": [
                    {
                        "id": cat.get("id"),
                        "name": cat.get("name"),
                        "slug": cat.get("slug"),
                    }
                    for cat in items
                ],
                "total": len(items),
            }
        except Exception as e:
            return {"error": str(e), "categories": [], "total": 0}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang lấy danh mục ngành nghề..."
            state["toolStatus"] = "get_categories"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run()

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = "Đã lấy xong danh mục." if not result.get("error") else "Không thể lấy danh mục."
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

        node.__name__ = "get_categories_node"
        return node