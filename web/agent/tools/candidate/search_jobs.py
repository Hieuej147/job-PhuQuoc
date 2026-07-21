import json
from typing import cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class SearchJobsInput(BaseModel):
    keyword: str = Field(description="Từ khóa tìm kiếm, vị trí hoặc kỹ năng")
    location: Optional[str] = Field(default=None, description="Thành phố hoặc remote")
    min_salary: Optional[int] = Field(
        default=None,
        description="Lương tối thiểu, đơn vị VNĐ (đồng). Ví dụ user nói '8 triệu' phải quy đổi thành 8000000."
    )
    max_salary: Optional[int] = Field(
        default=None,
        description="Lương tối đa, đơn vị VNĐ (đồng). Ví dụ user nói '12 triệu' phải quy đổi thành 12000000."
    )
    limit: int = Field(default=10, description="Số lượng kết quả")


class SearchJobsTool(BaseTool):
    name = "search_jobs"
    description = (
        "Tìm kiếm việc làm phù hợp theo từ khóa, địa điểm và mức lương. "
        "Dùng khi ứng viên muốn tìm việc hoặc xem gợi ý việc làm. "
        "TUYỆT ĐỐI KHÔNG DÙNG tool này nếu user yêu cầu 'thiết kế UI', 'tạo mẫu CV', 'làm template' hoặc 'code Tailwind'."
    )
    args_schema = SearchJobsInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "job_searcher"
            state["status"] = "running"
            state["currentStep"] = "Đang tìm việc phù hợp..."
            state["toolStatus"] = "search_jobs"
            state["progress"] = 45
            await copilotkit_emit_state(config, state)

            result = await tool_instance.run(
                keyword=args.get("keyword", ""),
                location=args.get("location"),
                min_salary=args.get("min_salary"),
                max_salary=args.get("max_salary"),
                limit=args.get("limit", 10),
            )

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = "Đã tìm xong việc phù hợp." if not result.get("error") else "Không thể tìm việc lúc này."
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

        node.__name__ = "job_searcher_node"
        return node

    async def run(
        self,
        keyword: str,
        location: Optional[str] = None,
        min_salary: Optional[int] = None,
        max_salary: Optional[int] = None,
        limit: int = 10,
    ) -> dict:
        import os
        import httpx

        ollama_url = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
        model = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ollama_url}/api/embeddings",
                    json={"model": model, "prompt": f"search_query: {keyword}"},
                    timeout=30.0
                )
                response.raise_for_status()
                embedding = response.json().get("embedding")

        except Exception as e:
            return {"error": f"Failed to generate embedding: {str(e)}", "jobs": [], "total": 0}

        # Đảm bảo embedding là list Python thuần
        embedding = list(embedding)

        payload = {
            "embedding": embedding,
            "limit": limit
        }

        if location:
            payload["wardId"] = location
        if min_salary:
            payload["salaryMin"] = min_salary
        if max_salary:
            payload["salaryMax"] = max_salary

        try:
            response = await self.api_client.post("/jobs/search-vector", json=payload)
            jobs = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(jobs, dict):
                jobs = jobs.get("items", [])
            if not isinstance(jobs, list):
                jobs = []
            return {
                "jobs": [
                    {
                        "id": j.get("id"),
                        "slug": j.get("slug"),
                        "title": j.get("title"),
                        "company": j.get("company"),
                        "salary": j.get("salary"),
                        "location": j.get("location"),
                        "type": j.get("type"),
                        "similarity": j.get("similarity"),
                    }
                    for j in jobs
                ],
                "total": len(jobs),
            }
        except Exception as e:
            return {"error": str(e), "jobs": [], "total": 0}
