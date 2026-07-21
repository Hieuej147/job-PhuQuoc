import html as html_lib
import json
from typing import cast, Literal, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from tools.base_tool import BaseTool


class DraftEmailInput(BaseModel):
    recipient_name: str = Field(description="Tên người nhận")
    email_type: Literal["interview", "rejection", "offer", "follow_up"] = Field(
        description="Loại email: interview, rejection, offer, follow_up"
    )
    job_title: str = Field(description="Tên vị trí tuyển dụng")
    company_name: str = Field(description="Tên công ty")
    additional_info: str = Field(default="", description="Thông tin thêm")
    interview_datetime: Optional[str] = Field(
        default=None,
        description="Thời gian phỏng vấn/hẹn cụ thể (nguyên văn từ nhà tuyển dụng), nếu có",
    )
    interview_location: Optional[str] = Field(
        default=None,
        description="Địa điểm phỏng vấn/hẹn cụ thể (nguyên văn từ nhà tuyển dụng), nếu có",
    )


# Màu dải nhấn đầu email theo từng loại — chỉ để phân biệt trực quan giữa các
# loại email, KHÔNG phải thương hiệu công ty (chủ đích: tối giản, không logo).
_ACCENT_COLOR = {
    "interview": "#2563eb",   # xanh dương — tin vui, cần phản hồi
    "rejection": "#6b7280",   # xám trung tính — tôn trọng, không quá u ám
    "offer": "#16a34a",       # xanh lá — tin tốt nhất
    "follow_up": "#d97706",   # cam — nhắc nhở, cần chú ý
}

_LABEL = {
    "interview": "Lời mời phỏng vấn",
    "rejection": "Kết quả ứng tuyển",
    "offer": "Thư mời làm việc",
    "follow_up": "Nhắc nhở ứng tuyển",
}


def _paragraphs(text: str) -> str:
    """Chuyển text nhiều đoạn (cách nhau bằng dòng trống) thành các thẻ <p>,
    escape ký tự đặc biệt để tránh vỡ layout hoặc lỗi hiển thị nếu user nhập
    thông tin thêm có chứa ký tự HTML đặc biệt (<, >, &...)."""
    if not text:
        return ""
    blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
    out = []
    for block in blocks:
        escaped = html_lib.escape(block).replace("\n", "<br>")
        out.append(f'<p style="margin:0 0 16px 0;">{escaped}</p>')
    return "".join(out)


def _meeting_info_box(interview_datetime: Optional[str], interview_location: Optional[str]) -> str:
    """Render 1 khối riêng, nổi bật cho thời gian/địa điểm — TÁCH BIỆT hoàn
    toàn khỏi additional_info (do LLM tự viết), để đảm bảo thông tin quan
    trọng này LUÔN xuất hiện đúng nguyên văn, không bị LLM diễn giải lại
    thành câu chung chung kiểu "thời gian trên" và làm mất dữ liệu thật."""
    if not interview_datetime and not interview_location:
        return ""

    rows = []
    if interview_datetime:
        rows.append(
            '<tr>'
            '<td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">Thời gian</td>'
            f'<td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">{html_lib.escape(interview_datetime)}</td>'
            '</tr>'
        )
    if interview_location:
        rows.append(
            '<tr>'
            '<td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">Địa điểm</td>'
            f'<td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">{html_lib.escape(interview_location)}</td>'
            '</tr>'
        )

    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" '
        'style="width:100%;margin:0 0 16px 0;background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;">'
        f'{"".join(rows)}'
        '</table>'
    )


def _wrap_email_html(email_type: str, company_name: str, body_html: str) -> str:
    """Bọc nội dung vào khung email HTML tối giản, chuyên nghiệp: dải màu nhấn
    trên đầu, nhãn loại email, khung trắng bo góc, footer minh bạch nguồn gửi.
    Toàn bộ style là inline vì phần lớn mail client strip <style> block."""
    accent = _ACCENT_COLOR.get(email_type, "#2563eb")
    label = _LABEL.get(email_type, "Thông báo")
    company_escaped = html_lib.escape(company_name)

    return f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="height:4px;background-color:{accent};line-height:4px;font-size:4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;font-weight:700;">{label}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 32px 40px;font-size:15px;line-height:1.65;color:#1f2937;">
              {body_html}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Email này được gửi bởi {company_escaped} qua nền tảng PQJobs.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class DraftEmailTool(BaseTool):
    name = "draft_email"
    description = (
        "Soạn NỘI DUNG email giao tiếp với ứng viên (chưa gửi đi), trả về HTML đã định dạng đẹp. "
        "Hỗ trợ: mời phỏng vấn, từ chối, offer, nhắc nhở. Nếu có thời gian/địa điểm cụ thể, PHẢI "
        "truyền vào interview_datetime/interview_location (nguyên văn) thay vì viết chung vào "
        "additional_info, để đảm bảo email luôn hiển thị đúng thời gian/địa điểm thật. "
        "Tool này chỉ tạo bản nháp (subject + body HTML) để nhà tuyển dụng xem lại; "
        "không tự gửi email."
    )
    args_schema = DraftEmailInput

    # Lưu ý: tool này KHÔNG nhận api_client — không gọi API backend, chỉ ghép
    # chuỗi template cố định theo email_type, nên không có rủi ro cookie/quyền
    # truy cập như các tool khác trong file này.
    async def run(
        self,
        recipient_name: str,
        email_type: str,
        job_title: str,
        company_name: str,
        additional_info: str = "",
        interview_datetime: Optional[str] = None,
        interview_location: Optional[str] = None,
    ) -> dict:
        recipient_escaped = html_lib.escape(recipient_name)
        job_escaped = html_lib.escape(job_title)
        company_escaped = html_lib.escape(company_name)

        greeting = f'<p style="margin:0 0 16px 0;">Kính gửi {recipient_escaped},</p>'
        signature = (
            f'<p style="margin:24px 0 0 0;">Trân trọng,<br>'
            f'<strong style="color:#111827;">{company_escaped}</strong></p>'
        )
        meeting_box = _meeting_info_box(interview_datetime, interview_location)

        subjects = {
            "interview": f"Lời mời phỏng vấn - {job_title} tại {company_name}",
            "rejection": f"Thông báo kết quả ứng tuyển - {job_title}",
            "offer": f"Thư mời làm việc - {job_title} tại {company_name}",
            "follow_up": f"Nhắc nhở - Đơn ứng tuyển {job_title}",
        }

        main_paragraphs = {
            "interview": (
                f'<p style="margin:0 0 16px 0;">Cảm ơn bạn đã quan tâm đến vị trí '
                f'<strong>{job_escaped}</strong> tại <strong>{company_escaped}</strong>.</p>'
                f'<p style="margin:0 0 16px 0;">Chúng tôi đã xem xét hồ sơ của bạn và muốn mời bạn '
                f'tham gia phỏng vấn.</p>'
                f'{meeting_box}'
                f'{_paragraphs(additional_info)}'
                f'<p style="margin:0 0 16px 0;">Vui lòng phản hồi email này để xác nhận thời gian phù hợp.</p>'
            ),
            "rejection": (
                f'<p style="margin:0 0 16px 0;">Cảm ơn bạn đã quan tâm đến vị trí '
                f'<strong>{job_escaped}</strong> tại <strong>{company_escaped}</strong>.</p>'
                f'<p style="margin:0 0 16px 0;">Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo '
                f'rằng hồ sơ của bạn chưa phù hợp với vị trí này tại thời điểm hiện tại.</p>'
                f'{_paragraphs(additional_info)}'
                f'<p style="margin:0 0 16px 0;">Chúc bạn may mắn trong quá trình tìm việc.</p>'
            ),
            "offer": (
                f'<p style="margin:0 0 16px 0;">Chúng tôi rất vui mừng thông báo rằng bạn đã được chọn '
                f'cho vị trí <strong>{job_escaped}</strong> tại <strong>{company_escaped}</strong>.</p>'
                f'{meeting_box}'
                f'{_paragraphs(additional_info)}'
                f'<p style="margin:0 0 16px 0;">Vui lòng phản hồi email này để xác nhận.</p>'
            ),
            "follow_up": (
                f'<p style="margin:0 0 16px 0;">Chúng tôi muốn nhắc nhở về đơn ứng tuyển vị trí '
                f'<strong>{job_escaped}</strong> tại <strong>{company_escaped}</strong>.</p>'
                f'{meeting_box}'
                f'{_paragraphs(additional_info)}'
                f'<p style="margin:0 0 16px 0;">Vui lòng liên hệ nếu bạn có thắc mắc.</p>'
            ),
        }

        subject = subjects.get(email_type, subjects["follow_up"])
        body_inner = greeting + main_paragraphs.get(email_type, main_paragraphs["follow_up"]) + signature
        body_html = _wrap_email_html(email_type, company_name, body_inner)

        return {
            "subject": subject,
            "body": body_html,
            "email_type": email_type,
            "recipient": recipient_name,
        }

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang soạn email..."
            state["toolStatus"] = "draft_email"
            state["progress"] = 60
            await copilotkit_emit_state(config, state)

            # Không có api_client -> không cần sync_auth_from_state ở đây.
            result = await tool_instance.run(
                recipient_name=args.get("recipient_name"),
                email_type=args.get("email_type"),
                job_title=args.get("job_title"),
                company_name=args.get("company_name"),
                additional_info=args.get("additional_info", ""),
                interview_datetime=args.get("interview_datetime"),
                interview_location=args.get("interview_location"),
            )

            state["status"] = "done"
            state["currentStep"] = "Đã soạn xong email."
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

        node.__name__ = "draft_email_node"
        return node