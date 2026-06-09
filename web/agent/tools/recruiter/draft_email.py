from pydantic import BaseModel, Field
from typing import Literal
from tools.base_tool import BaseTool


class DraftEmailInput(BaseModel):
    recipient_name: str = Field(description="Tên người nhận")
    email_type: Literal["interview", "rejection", "offer", "follow_up"] = Field(
        description="Loại email: interview, rejection, offer, follow_up"
    )
    job_title: str = Field(description="Tên vị trí tuyển dụng")
    company_name: str = Field(description="Tên công ty")
    additional_info: str = Field(default="", description="Thông tin thêm")


class DraftEmailTool(BaseTool):
    name = "draft_email"
    description = (
        "Soạn email giao tiếp với ứng viên. "
        "Hỗ trợ: mời phỏng vấn, từ chối, offer, nhắc nhở."
    )
    args_schema = DraftEmailInput

    async def run(
        self,
        recipient_name: str,
        email_type: str,
        job_title: str,
        company_name: str,
        additional_info: str = "",
    ) -> dict:
        templates = {
            "interview": {
                "subject": f"Lời mời phỏng vấn - {job_title} tại {company_name}",
                "body": f"""Kính gửi {recipient_name},

Cảm ơn bạn đã quan tâm đến vị trí {job_title} tại {company_name}.

Chúng tôi đã xem xét hồ sơ của bạn và muốn mời bạn tham gia phỏng vấn.

{additional_info}

Vui lòng phản hồi email này để xác nhận thời gian phù hợp.

Trân trọng,
{company_name}""",
            },
            "rejection": {
                "subject": f"Thông báo kết quả ứng tuyển - {job_title}",
                "body": f"""Kính gửi {recipient_name},

Cảm ơn bạn đã quan tâm đến vị trí {job_title} tại {company_name}.

Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn chưa phù hợp với vị trí này tại thời điểm hiện tại.

{additional_info}

Chúc bạn may mắn trong quá trình tìm việc.

Trân trọng,
{company_name}""",
            },
            "offer": {
                "subject": f"Thư mời làm việc - {job_title} tại {company_name}",
                "body": f"""Kính gửi {recipient_name},

Chúng tôi rất vui mừng thông báo rằng bạn đã được chọn cho vị trí {job_title} tại {company_name}.

{additional_info}

Vui lòng phản hồi email này để xác nhận.

Trân trọng,
{company_name}""",
            },
            "follow_up": {
                "subject": f"Nhắc nhở - Đơn ứng tuyển {job_title}",
                "body": f"""Kính gửi {recipient_name},

Chúng tôi muốn nhắc nhở về đơn ứng tuyển vị trí {job_title} tại {company_name}.

{additional_info}

Vui lòng liên hệ nếu bạn có thắc mắc.

Trân trọng,
{company_name}""",
            },
        }

        template = templates.get(email_type, templates["follow_up"])
        return {
            "subject": template["subject"],
            "body": template["body"],
            "email_type": email_type,
            "recipient": recipient_name,
        }
