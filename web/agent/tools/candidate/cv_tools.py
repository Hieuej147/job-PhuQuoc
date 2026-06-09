import json
import logging
from typing import Type, Any, cast
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.types import interrupt
from copilotkit.langchain import copilotkit_emit_state

logger = logging.getLogger(__name__)


# ============================================================
# Schemas
# ============================================================

class GenerateCVTemplateInput(BaseModel):
    description: str = Field(
        description="Mô tả CV dựa trên thông tin user đã cung cấp."
    )


class AdjustCVTemplateInput(BaseModel):
    adjustment: str = Field(
        description="Yêu cầu điều chỉnh. Ví dụ: 'Đổi màu header thành xanh đậm'"
    )


class SaveResumeInput(BaseModel):
    title: str = Field(default="CV của tôi", description="Tiêu đề CV")


# ============================================================
# Helpers
# ============================================================

def _build_user_context(state: dict) -> str:
    parts = []
    if state.get("user_name"):
        parts.append(f"Họ tên: {state['user_name']}")
    if state.get("user_email"):
        parts.append(f"Email: {state['user_email']}")
    if state.get("user_phone"):
        parts.append(f"Điện thoại: {state['user_phone']}")
    if state.get("user_address"):
        parts.append(f"Địa chỉ: {state['user_address']}")
    if state.get("user_summary"):
        parts.append(f"Tóm tắt: {state['user_summary']}")
    if state.get("user_skills"):
        parts.append(f"Kỹ năng: {', '.join(state['user_skills'])}")
    if state.get("user_languages"):
        parts.append(f"Ngôn ngữ: {', '.join(state['user_languages'])}")
    if state.get("user_education"):
        for edu in state["user_education"]:
            parts.append(f"Học vấn: {edu.get('school', '')} - {edu.get('degree', '')} ({edu.get('startYear', '')}-{edu.get('endYear', '')})")
    if state.get("user_experience"):
        for exp in state["user_experience"]:
            parts.append(f"Kinh nghiệm: {exp.get('company', '')} - {exp.get('position', '')} ({exp.get('startYear', '')}-{exp.get('endYear', '')})")
    if state.get("user_projects"):
        for proj in state["user_projects"]:
            parts.append(f"Dự án: {proj.get('name', '')} - {proj.get('description', '')}")
    return "\n".join(parts) if parts else "Chưa có thông tin"


def _build_resume_data(state: dict) -> dict:
    return {
        "title": f"CV {state.get('user_name', 'của tôi')}",
        "summary": state.get("user_summary", ""),
        "skills": ", ".join(state.get("user_skills", [])),
        "degree": state.get("user_degree", ""),
        "languages": ", ".join(state.get("user_languages", [])),
        "address": state.get("user_address", ""),
        "education": state.get("user_education", []),
        "experience": state.get("user_experience", []),
        "projects": state.get("user_projects", []),
        "templateId": state.get("current_template_id", ""),
    }


def _parse_json_from_llm(content: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        json_lines = []
        in_block = False
        for line in lines:
            if line.startswith("```"):
                in_block = not in_block
                continue
            if in_block:
                json_lines.append(line)
        content = "\n".join(json_lines)
    return json.loads(content)


# ============================================================
# GenerateCVTemplateTool
# ============================================================

class GenerateCVTemplateTool(BaseTool):
    name: str = "generate_cv_template"
    description: str = (
        "Tạo CV template mới dựa trên thông tin user đã cung cấp. "
        "Hiển thị preview card trong chat."
    )
    args_schema: type[BaseModel] = GenerateCVTemplateInput

    api_client: Any = None
    llm: Any = None

    def to_langchain_tool(self):
        from langchain_core.tools import StructuredTool
        return StructuredTool(
            name=self.name,
            description=self.description,
            args_schema=self.args_schema,
            coroutine=self._run_for_llm,
        )

    async def _run_for_llm(self, description: str) -> str:
        return "Đang tạo CV..."

    def _run(self, *args, **kwargs):
        raise NotImplementedError("Dùng as_node().")

    async def _arun(self, *args, **kwargs):
        raise NotImplementedError("Dùng as_node().")

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            logger.info("[generate_template_node] Starting...")

            # 1. Extract tool call
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call["args"]
            description = args.get("description", "")

            # 2. Emit state: generating
            state["cv_flow"] = "generating"
            state["step"] = "Đang tạo CV..."
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            # 3. Generate HTML/CSS with LLM
            try:
                html, css, name = await tool_instance._generate_with_llm(description, state)
                logger.info(f"[generate_template_node] Generated: {name}, html={len(html)}")
            except Exception as e:
                logger.error(f"[generate_template_node] Error: {e}")
                state["cv_flow"] = "idle"
                state["step"] = ""
                state["progress"] = 0
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content=f"❌ Lỗi tạo template: {e}",
                )]
                await copilotkit_emit_state(config, state)
                return state

            # 4. Update state
            state["current_template_html"] = html
            state["current_template_css"] = css
            state["cv_flow"] = "preview"
            state["step"] = "CV đã tạo! Xem preview."
            state["progress"] = 80

            # 5. Tool result = JSON có HTML → useRenderTool sẽ parse
            result_json = json.dumps({
                "name": name,
                "html": html,
                "css": css,
            })

            state["messages"] = [ToolMessage(
                tool_call_id=tool_call_id, name=tool_call["name"],
                content=result_json,
            )]

            # 6. Emit state + return full state
            await copilotkit_emit_state(config, state)
            logger.info(f"[generate_template_node] Done, returning full state")
            return state

        node.__name__ = "generate_template_node"
        return node

    async def _generate_with_llm(self, description: str, state: dict):
        if not self.llm:
            raise ValueError("LLM not configured")

        user_info = _build_user_context(state)

        prompt = f"""Bạn là chuyên gia thiết kế CV. Tạo template CV HTML với INLINE CSS.

THÔNG TIN USER:
{user_info}

MÔ TẢ: {description}

YÊU CẦU BẮT BUỘC:
1. HTML với INLINE CSS (style attribute trên mỗi element)
2. Dùng data-field markers: name, email, phone, address, degree, summary, skills, languages
3. Sections: data-section="education", data-repeat="education", data-field="education.school"
4. Kích thước A4 (max-width: 210mm, min-height: 297mm)
5. Không dùng script, iframe, form, input, button
6. Không dùng Tailwind CSS, không dùng class
7. Dùng {{{{name}}}}, {{{{email}}}}... làm placeholders
8. Font: Inter, Arial, sans-serif

THIẾT KẾ CHUYÊN NGHIỆP:
- Màu chủ đạo: #005a71 (xanh dương đậm) cho headings
- Màu phụ: #666 cho text thường
- Background: trắng #fff
- Border-bottom cho section headings: 2px solid #005a71
- Spacing: padding 40px, margin-bottom 24px cho sections
- Header: tên lớn 28px, thông tin liên lạc nhỏ hơn
- Kinh nghiệm: position bold 16px, company + thời gian màu #666
- Skills: liệt kế bằng dấu phẩy hoặc bullet points
- Layout sạch, dễ đọc, chuyên nghiệp

TRẢ VỀ JSON:
{{{{"name": "Tên template", "html": "HTML content với inline css", "css": ""}}}}
CHỈ TRẢ VỀ JSON, KHÔNG giải thích."""

        response = await self.llm.ainvoke([
            SystemMessage(content="Bạn là chuyên gia thiết kế CV HTML/CSS. Luôn trả về JSON hợp lệ."),
            HumanMessage(content=prompt),
        ])

        result = _parse_json_from_llm(response.content)
        if "html" not in result:
            raise ValueError("Template không hợp lệ: thiếu HTML")

        return result["html"], result.get("css", ""), result.get("name", "Custom Template")


# ============================================================
# AdjustCVTemplateTool
# ============================================================

class AdjustCVTemplateTool(BaseTool):
    name: str = "adjust_cv_template"
    description: str = (
        "Điều chỉnh template CV hiện có dựa trên yêu cầu. "
        "Giữ nguyên data-field markers."
    )
    args_schema: type[BaseModel] = AdjustCVTemplateInput

    llm: Any = None

    def __init__(self, llm: Any = None):
        super().__init__()
        self.llm = llm

    def _run(self, *args, **kwargs):
        raise NotImplementedError("Dùng to_langchain_tool().")

    async def _arun(self, *args, **kwargs):
        raise NotImplementedError("Dùng to_langchain_tool().")

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            logger.info("[adjust_template_node] Starting...")

            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call["args"]
            adjustment = args.get("adjustment", "")

            # Check if template exists
            current_html = state.get("current_template_html", "")
            current_css = state.get("current_template_css", "")

            if not current_html:
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content="Chưa có template nào. Cần tạo CV trước.",
                )]
                return state

            # Emit state: editing
            state["cv_flow"] = "editing"
            state["step"] = "Đang chỉnh sửa..."
            await copilotkit_emit_state(config, state)

            # Adjust with LLM
            try:
                new_html, new_css, changes = await tool_instance._adjust_with_llm(current_html, current_css, adjustment)
                logger.info(f"[adjust_template_node] Adjusted: {changes}")
            except Exception as e:
                logger.error(f"[adjust_template_node] Error: {e}")
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content=f"❌ Lỗi chỉnh sửa: {e}",
                )]
                return state

            # Update state
            state["current_template_html"] = new_html
            state["current_template_css"] = new_css
            state["cv_flow"] = "preview"
            state["step"] = "Đã chỉnh sửa!"

            state["messages"] = [ToolMessage(
                tool_call_id=tool_call_id, name=tool_call["name"],
                content=f"Đã cập nhật CV: {changes}",
            )]

            await copilotkit_emit_state(config, state)
            return state

        node.__name__ = "adjust_template_node"
        return node

    async def _adjust_with_llm(self, current_html: str, current_css: str, adjustment: str):
        if not self.llm:
            raise ValueError("LLM not configured")

        prompt = f"""Điều chỉnh template CV. Giữ nguyên data-field markers.

HTML HIỆN TẠI:
{current_html[:3000]}

YÊU CẦU: {adjustment}

TRẢ VỀ JSON: {{{{"html": "...", "css": "...", "changes": "Mô tả"}}}}
CHỈ TRẢ VỀ JSON."""

        response = await self.llm.ainvoke([
            SystemMessage(content="Bạn là chuyên gia thiết kế CV. Luôn trả về JSON hợp lệ."),
            HumanMessage(content=prompt),
        ])

        result = _parse_json_from_llm(response.content)
        return result["html"], result.get("css", current_css), result.get("changes", "Đã điều chỉnh")

    def to_langchain_tool(self):
        from langchain_core.tools import StructuredTool
        return StructuredTool(
            name=self.name,
            description=self.description,
            args_schema=self.args_schema,
            coroutine=self._run_for_llm,
        )

    async def _run_for_llm(self, adjustment: str) -> str:
        return "Đang chỉnh sửa CV..."


# ============================================================
# SaveResumeTool
# ============================================================

class SaveResumeTool(BaseTool):
    name: str = "save_resume"
    description: str = (
        "Lưu CV đã tạo vào hệ thống. "
        "Sử dụng sau khi user đã xem preview và muốn lưu."
    )
    args_schema: type[BaseModel] = SaveResumeInput

    api_client: Any = None

    def _run(self, *args, **kwargs):
        raise NotImplementedError("Dùng as_node().")

    async def _arun(self, *args, **kwargs):
        raise NotImplementedError("Dùng as_node().")

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            logger.info("[save_resume_node] Starting...")

            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call["args"]
            title = args.get("title", "CV của tôi")

            # Check if template exists
            html = state.get("current_template_html")
            if not html:
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content="Chưa có CV nào. Cần tạo CV trước.",
                )]
                return state

            # Build resume data
            resume_data = _build_resume_data(state)
            resume_data["title"] = title

            # Save to backend (qua BFF proxy — path chỉ cần /resumes)
            try:
                if tool_instance.api_client:
                    result = await tool_instance.api_client.post("/resumes", json=resume_data)
                    resume_id = result.get("data", {}).get("id") or result.get("id")
                    state["current_resume_id"] = resume_id
                else:
                    state["current_resume_id"] = "mock-id"
            except Exception as e:
                logger.error(f"[save_resume_node] Error: {e}")
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content=f"❌ Lỗi lưu CV: {e}",
                )]
                return state

            # Clean state after save
            state["cv_flow"] = "idle"
            state["step"] = ""
            state["progress"] = 0

            state["messages"] = [ToolMessage(
                tool_call_id=tool_call_id, name=tool_call["name"],
                content=f"Đã lưu CV thành công! ID: {state.get('current_resume_id')}. Bạn muốn export PDF không?",
            )]

            await copilotkit_emit_state(config, state)
            logger.info(f"[save_resume_node] Saved: {state.get('current_resume_id')}")
            return state

        node.__name__ = "save_resume_node"
        return node

    def to_langchain_tool(self):
        from langchain_core.tools import StructuredTool
        return StructuredTool(
            name=self.name,
            description=self.description,
            args_schema=self.args_schema,
            coroutine=self._run_for_llm,
        )

    async def _run_for_llm(self, title: str = "CV của tôi") -> str:
        return "Đang lưu CV..."
