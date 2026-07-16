from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient


class CreateJobInput(BaseModel):
    title: str = Field(description="Tiêu đề tin tuyển dụng")
    description: str = Field(description="Mô tả công việc chi tiết")
    category_id: str = Field(description="ID danh mục ngành nghề (lấy từ get_categories)")
    ward_id: str = Field(description="ID khu vực/phường/xã làm việc (lấy từ get_work_locations)")
    address_detail: str = Field(description="Địa chỉ làm việc chi tiết, ví dụ tên tòa nhà, đường, khu du lịch")
    type: str = Field(
        description="Loại hình: FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP, FREELANCE"
    )
    experience: Optional[str] = Field(
        default=None,
        description="Kinh nghiệm: NO_EXPERIENCE, UNDER_1_YEAR, ONE_TO_THREE_YEARS, THREE_TO_FIVE_YEARS, OVER_FIVE_YEARS"
    )
    level: Optional[str] = Field(
        default=None,
        description="Cấp bậc: INTERN, FRESHER, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR"
    )
    salary_min: Optional[int] = Field(
        default=None,
        description="Lương tối thiểu (VND). Ví dụ: 8000000"
    )
    salary_max: Optional[int] = Field(
        default=None,
        description="Lương tối đa (VND). Ví dụ: 15000000"
    )
    requirements: Optional[str] = Field(
        default=None,
        description="Yêu cầu ứng viên"
    )
    benefits: Optional[str] = Field(
        default=None,
        description="Quyền lợi và phúc lợi"
    )
    quantity: Optional[int] = Field(
        default=1,
        description="Số lượng tuyển dụng"
    )


class CreateJobTool(BaseTool):
    name = "create_job"
    description = (
        "Tạo tin tuyển dụng mới ở trạng thái DRAFT. "
        "Dùng SAU KHI đã có category_id từ get_categories, ward_id từ get_work_locations "
        "và đã xác nhận đầy đủ thông tin với nhà tuyển dụng. "
        "Job tạo xong ở trạng thái DRAFT, cần thanh toán để kích hoạt."
    )
    args_schema = CreateJobInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        title: str,
        description: str,
        category_id: str,
        ward_id: str,
        address_detail: str,
        type: str,
        experience: Optional[str] = None,
        level: Optional[str] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        requirements: Optional[str] = None,
        benefits: Optional[str] = None,
        quantity: int = 1,
    ) -> dict:
        try:
            payload = {
                "title": title,
                "description": description,
                "categoryId": category_id,
                "wardId": ward_id,
                "addressDetail": address_detail,
                "type": type,
                "quantity": quantity,
            }

            if experience:
                payload["experience"] = experience
            if level:
                payload["level"] = level
            if salary_min:
                payload["salaryMin"] = salary_min
            if salary_max:
                payload["salaryMax"] = salary_max
            if requirements:
                payload["requirements"] = requirements
            if benefits:
                payload["benefits"] = benefits

            response = await self.api_client.post("/jobs", json=payload)
            job = response.get("data", response) if isinstance(response, dict) else response

            return {
                "success": True,
                "job_id": job.get("id"),
                "slug": job.get("slug"),
                "title": job.get("title"),
                "status": job.get("status"),
                "message": (
                    f"Đã tạo tin tuyển dụng '{title}' thành công! "
                    f"Trạng thái hiện tại: DRAFT. "
                    f"Vui lòng vào trang thanh toán để kích hoạt tin đăng."
                ),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Không thể tạo tin tuyển dụng. Vui lòng thử lại.",
            }
