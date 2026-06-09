from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class SearchJobsInput(BaseModel):
    keyword: str = Field(description="Từ khóa tìm kiếm, vị trí hoặc kỹ năng")
    location: Optional[str] = Field(default=None, description="Thành phố hoặc remote")
    min_salary: Optional[int] = Field(default=None, description="Lương tối thiểu")
    max_salary: Optional[int] = Field(default=None, description="Lương tối đa")
    limit: int = Field(default=10, description="Số lượng kết quả")


class SearchJobsTool(BaseTool):
    name = "search_jobs"
    description = (
        "Tìm kiếm việc làm phù hợp theo từ khóa, địa điểm và mức lương. "
        "Dùng khi ứng viên muốn tìm việc hoặc xem gợi ý việc làm."
    )
    args_schema = SearchJobsInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        keyword: str,
        location: Optional[str] = None,
        min_salary: Optional[int] = None,
        max_salary: Optional[int] = None,
        limit: int = 10,
    ) -> dict:
        params = {
            "search": keyword,
            "status": "ACTIVE",
            "limit": limit,
        }
        if location:
            params["wardId"] = location
        if min_salary:
            params["salaryMin"] = min_salary
        if max_salary:
            params["salaryMax"] = max_salary

        try:
            response = await self.api_client.get("/jobs", params=params)
            jobs = response.get("items", [])
            return {
                "jobs": [
                    {
                        "id": j.get("id"),
                        "title": j.get("title"),
                        "company": j.get("company", {}).get("name"),
                        "salary": f"{j.get('salaryMin', '?')}-{j.get('salaryMax', '?')}",
                        "location": j.get("wardId"),
                        "type": j.get("type"),
                    }
                    for j in jobs
                ],
                "total": response.get("total", 0),
            }
        except Exception as e:
            return {"error": str(e), "jobs": [], "total": 0}
