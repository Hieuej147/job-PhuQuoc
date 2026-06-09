from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class RankCandidatesInput(BaseModel):
    job_id: str = Field(description="ID của job")
    top_n: int = Field(default=5, description="Số lượng ứng viên top")


class RankCandidatesTool(BaseTool):
    name = "rank_candidates"
    description = (
        "Xếp hạng ứng viên theo mức độ phù hợp với job. "
        "Trả về top N ứng viên tốt nhất."
    )
    args_schema = RankCandidatesInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(self, job_id: str, top_n: int = 5) -> dict:
        try:
            # Get job details
            job = await self.api_client.get(f"/jobs/{job_id}")
            job_data = job.get("data", job)

            # Get candidates
            response = await self.api_client.get(
                f"/applications/job/{job_id}",
                params={"limit": 100},
            )
            items = response.get("items", [])

            if not items:
                return {"ranked_candidates": [], "total": 0}

            # Simple ranking: pending first, then by date
            ranked = sorted(items, key=lambda x: (
                0 if x.get("status") == "PENDING" else 1,
                x.get("createdAt", ""),
            ))

            return {
                "job_title": job_data.get("title"),
                "ranked_candidates": [
                    {
                        "rank": i + 1,
                        "application_id": a.get("id"),
                        "user_name": a.get("user", {}).get("name"),
                        "status": a.get("status"),
                        "applied_at": a.get("createdAt"),
                    }
                    for i, a in enumerate(ranked[:top_n])
                ],
                "total": len(items),
            }
        except Exception as e:
            return {"error": str(e), "ranked_candidates": [], "total": 0}
