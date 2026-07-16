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
