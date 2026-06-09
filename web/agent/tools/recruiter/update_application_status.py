from pydantic import BaseModel, Field
from typing import Literal
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class UpdateApplicationStatusInput(BaseModel):
    application_id: str = Field(description="ID của đơn ứng tuyển")
    status: Literal["PENDING", "ACCEPTED", "REJECTED"] = Field(
        description="Trạng thái mới: PENDING, ACCEPTED, REJECTED"
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
            response = await self.api_client.patch(
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
