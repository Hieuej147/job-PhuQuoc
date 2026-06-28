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
    