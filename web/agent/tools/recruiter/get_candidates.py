from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class GetCandidatesInput(BaseModel):
    job_id: str = Field(description="ID của job muốn xem ứng viên")
    status: Optional[str] = Field(default=None, description="Lọc theo trạng thái: PENDING, ACCEPTED, REJECTED")
    limit: int = Field(default=20, description="Số lượng kết quả")


class GetCandidatesTool(BaseTool):
    name = "get_candidates"
    description = (
        "Xem danh sách ứng viên đã nộp đơn cho một job cụ thể. "
        "Dùng khi nhà tuyển dụng muốn xem ai đã apply."
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
            items = response.get("items", [])

            # Filter by status if provided
            if status:
                items = [a for a in items if a.get("status") == status]

            return {
                "candidates": [
                    {
                        "application_id": a.get("id"),
                        "user_name": a.get("user", {}).get("name"),
                        "user_email": a.get("user", {}).get("email"),
                        "status": a.get("status"),
                        "applied_at": a.get("createdAt"),
                        "cover_letter": a.get("coverLetter"),
                    }
                    for a in items
                ],
                "total": len(items),
            }
        except Exception as e:
            return {"error": str(e), "candidates": [], "total": 0}
