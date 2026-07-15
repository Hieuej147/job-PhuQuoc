import json
import re
from typing import cast, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool
from core.api_client import ApiClient


def _extract_ordinal(text: Optional[str]) -> Optional[int]:
    """Trích số thứ tự (1-based) từ chuỗi kiểu 'mẫu 5', 'số 3', 'thứ 2', hoặc chỉ '5'."""
    if not text:
        return None
    match = re.search(r"\d+", text)
    if not match:
        return None
    try:
        return int(match.group())
    except ValueError:
        return None


class ChooseCvTemplateInput(BaseModel):
    style_preference: Optional[str] = Field(
        default=None,
        description=(
            "Tên hoặc phong cách mẫu CV mà user đã chọn, ví dụ 'Modern Professional', "
            "'Classic Elegant', 'chuyên nghiệp', 'sáng tạo'... Để trống nếu user CHƯA chọn "
            "(lần gọi đầu tiên để lấy danh sách mẫu hiện có)."
        ),
    )
    template_index: Optional[int] = Field(
        default=None,
        description=(
            "Số thứ tự mẫu (1-based) mà user chọn theo đúng thứ tự đã liệt kê ở lần gọi trước "
            "(ví dụ user nói 'mẫu 5', 'mẫu số 3', 'cái thứ 2' → truyền 5, 3, 2 tương ứng). "
            "ƯU TIÊN dùng field này khi user chọn theo số thứ tự thay vì tên — chính xác tuyệt đối, "
            "không phụ thuộc việc nhớ đúng tên mẫu, kể cả ở cuộc trò chuyện khác không còn ngữ cảnh cũ."
        ),
    )
    auto_select: bool = Field(
        default=False,
        description=(
            "True CHỈ KHI user đã đồng ý để AI tự chọn thay (ví dụ user nói 'bạn chọn giúp tôi', "
            "'mẫu nào cũng được', 'tùy bạn'). Không tự đặt True nếu chưa hỏi qua user."
        ),
    )


class ChooseCvTemplateTool(BaseTool):
    name = "choose_cv_template"
    description = (
        "Lấy danh sách mẫu (template) CV hiện có và/hoặc chọn 1 mẫu cụ thể cho candidate. "
        "BẮT BUỘC gọi tool này TRƯỚC KHI tạo CV mới (trước khi gọi save_cv không có resume_id). "
        "LẦN GỌI ĐẦU TIÊN: không truyền style_preference/template_index/auto_select — tool sẽ trả về "
        "danh sách available_templates để AI liệt kê CÓ ĐÁNH SỐ THỨ TỰ (1, 2, 3...) và HỎI user muốn "
        "dùng mẫu nào, KHÔNG được tự chọn ngay. "
        "LẦN GỌI THỨ HAI (sau khi user đã trả lời): nếu user chọn theo số thứ tự (ví dụ 'mẫu 5', "
        "'cái thứ 2') thì truyền template_index (1-based, ưu tiên dùng cách này vì chính xác tuyệt đối); "
        "nếu user nêu tên mẫu thì truyền style_preference; nếu user để AI tự chọn thì truyền auto_select=true. "
        "Kết quả trả về template_id=None nghĩa là CHƯA xác định được mẫu, phải hỏi lại user, "
        "không được gọi save_cv khi đó."
    )
    args_schema = ChooseCvTemplateInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        style_preference: Optional[str] = None,
        template_index: Optional[int] = None,
        auto_select: bool = False,
    ) -> dict:
        try:
            response = await self.api_client.get("/resumes/templates")
            items = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(items, dict):
                items = items.get("items", [])
            if not isinstance(items, list) or not items:
                return {"error": "Không tìm thấy template CV nào khả dụng trong hệ thống."}

            available = [
                {"id": t.get("id"), "name": t.get("name"), "description": t.get("description")}
                for t in items
            ]

            # Ưu tiên 1: template_index tường minh — chính xác tuyệt đối theo vị trí,
            # không phụ thuộc AI có nhớ đúng ngữ cảnh/tên mẫu hay không.
            ordinal = template_index
            # Ưu tiên 2: nếu AI lỡ vẫn nhét số vào style_preference (vd "mẫu 5", "5"),
            # tự trích số ra dùng thay vì bắt gọi lại.
            if ordinal is None and style_preference:
                normalized = style_preference.strip().lower()
                looks_like_ordinal = normalized.isdigit() or normalized.startswith(
                    ("mẫu", "mau", "số", "so", "thứ", "thu")
                )
                if looks_like_ordinal:
                    ordinal = _extract_ordinal(style_preference)

            chosen = None
            if ordinal is not None:
                if 1 <= ordinal <= len(items):
                    chosen = items[ordinal - 1]
                else:
                    return {
                        "error": f"Không có mẫu số {ordinal}. Hiện chỉ có {len(items)} mẫu.",
                        "available_templates": available,
                    }

            # Ưu tiên 3: so khớp theo tên/mô tả nếu chưa xác định được qua số thứ tự.
            if chosen is None and style_preference:
                keyword = style_preference.strip().lower()
                for tpl in items:
                    text = f"{tpl.get('name', '')} {tpl.get('description', '')}".lower()
                    if keyword in text:
                        chosen = tpl
                        break

            if chosen is None and auto_select:
                chosen = items[0]

            if chosen is None:
                # Chưa xác định được mẫu cụ thể — trả danh sách để AI hỏi lại user,
                # KHÔNG tự fallback chọn đại 1 mẫu.
                return {
                    "template_id": None,
                    "available_templates": available,
                    "need_user_choice": True,
                }

            return {
                "template_id": chosen.get("id"),
                "template_name": chosen.get("name"),
                "available_templates": available,
            }
        except Exception as e:
            return {"error": str(e)}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "cv_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang lấy danh sách mẫu CV..."
            state["toolStatus"] = "choose_cv_template"
            state["progress"] = 30
            await copilotkit_emit_state(config, state)

            result = await tool_instance.run(
                style_preference=args.get("style_preference"),
                template_index=args.get("template_index"),
                auto_select=args.get("auto_select", False),
            )

            has_error = bool(result.get("error"))
            needs_choice = bool(result.get("need_user_choice"))
            state["status"] = "error" if has_error else "done"
            if has_error:
                state["currentStep"] = "Không lấy được danh sách mẫu CV."
            elif needs_choice:
                state["currentStep"] = "Đang chờ bạn chọn mẫu CV..."
            else:
                state["currentStep"] = f"Đã chọn mẫu: {result.get('template_name', '')}"
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

        node.__name__ = "choose_cv_template_node"
        return node