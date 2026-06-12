import json
import logging
import re
from typing import Type, Any, cast
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.types import interrupt
from copilotkit.langchain import copilotkit_emit_state

logger = logging.getLogger(__name__)

MAX_TEMPLATE_REPAIR_ATTEMPTS = 2
BLOCKED_HTML_PATTERNS = [
    re.compile(r"<script[\s>]", re.IGNORECASE),
    re.compile(r"</script", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),
    re.compile(r"<iframe", re.IGNORECASE),
    re.compile(r"<object", re.IGNORECASE),
    re.compile(r"<embed", re.IGNORECASE),
    re.compile(r"<form", re.IGNORECASE),
    re.compile(r"<input", re.IGNORECASE),
    re.compile(r"<button", re.IGNORECASE),
    re.compile(r"<select", re.IGNORECASE),
    re.compile(r"<textarea", re.IGNORECASE),
    re.compile(r"data\s*:", re.IGNORECASE),
    re.compile(r"vbscript\s*:", re.IGNORECASE),
]
BLOCKED_CSS_PATTERNS = [
    re.compile(r"expression\s*\(", re.IGNORECASE),
    re.compile(r"@import", re.IGNORECASE),
    re.compile(r"url\s*\(", re.IGNORECASE),
    re.compile(r"behavior\s*:", re.IGNORECASE),
    re.compile(r"-moz-binding", re.IGNORECASE),
    re.compile(r"position\s*:\s*fixed", re.IGNORECASE),
]


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


def _unwrap_api_data(response: Any) -> Any:
    """Unwrap backend responses that may be wrapped by Nest interceptors."""
    data = response
    while isinstance(data, dict) and "data" in data and len(data) <= 2:
        next_data = data.get("data")
        if next_data is data:
            break
        data = next_data
    return data


def _extract_api_id(response: Any) -> str | None:
    data = _unwrap_api_data(response)
    if isinstance(data, dict):
        value = data.get("id")
        return value if isinstance(value, str) else None
    return None


def _validate_template_artifacts(html: str, css: str) -> list[str]:
    errors: list[str] = []

    if len(html) > 100 * 1024:
        errors.append(f"HTML quá lớn ({len(html)} bytes)")
    if len(css) > 50 * 1024:
        errors.append(f"CSS quá lớn ({len(css)} bytes)")

    for pattern in BLOCKED_HTML_PATTERNS:
        if pattern.search(html):
            errors.append(f"HTML chứa pattern không an toàn: {pattern.pattern}")

    for pattern in BLOCKED_CSS_PATTERNS:
        if pattern.search(css):
            errors.append(f"CSS chứa pattern không an toàn: {pattern.pattern}")

    return errors


def _sanitize_template_artifacts(html: str, css: str) -> tuple[str, str]:
    sanitized_html = html
    sanitized_html = re.sub(r"<script[\s\S]*?<\/script>", "", sanitized_html, flags=re.IGNORECASE)
    sanitized_html = re.sub(
        r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)",
        "",
        sanitized_html,
        flags=re.IGNORECASE,
    )
    sanitized_html = re.sub(r"javascript\s*:", "", sanitized_html, flags=re.IGNORECASE)

    sanitized_css = css
    sanitized_css = re.sub(r"@import[^;]+;", "", sanitized_css, flags=re.IGNORECASE)
    sanitized_css = re.sub(r"url\s*\([^)]*\)", "", sanitized_css, flags=re.IGNORECASE)
    sanitized_css = re.sub(r"expression\s*\([^)]*\)", "", sanitized_css, flags=re.IGNORECASE)

    return sanitized_html.strip(), sanitized_css.strip()


async def _repair_template_if_needed(
    tool_instance: Any,
    state: dict,
    config: RunnableConfig,
    purpose: str,
    name: str,
    html: str,
    css: str,
    extra_context: str = "",
) -> tuple[str, str, str]:
    current_name = name
    current_html, current_css = _sanitize_template_artifacts(html, css)
    errors = _validate_template_artifacts(current_html, current_css)

    attempt = 0
    while errors and attempt < MAX_TEMPLATE_REPAIR_ATTEMPTS:
        attempt += 1
        state["activeWorker"] = "cv_reviewer"
        state["status"] = "running"
        state["currentStep"] = f"Đang đánh giá template CV ({attempt}/{MAX_TEMPLATE_REPAIR_ATTEMPTS})..."
        state["toolStatus"] = f"{purpose}_review"
        state["progress"] = min(90, 60 + attempt * 10)
        await copilotkit_emit_state(config, state)

        prompt = f"""Bạn là worker review template CV. Nhiệm vụ: sửa template để pass validator backend.

MỤC TIÊU:
- Không được dùng script, iframe, form, input, button, event handler, external assets.
- Không được dùng @import, url(...), Google Fonts, font ngoài, CDN, CSS external.
- Giữ placeholders và data-section/data-repeat.

{extra_context}

LỖI HIỆN TẠI:
{json.dumps(errors, ensure_ascii=False)}

NAME HIỆN TẠI:
{current_name}

HTML HIỆN TẠI:
{current_html[:12000]}

CSS HIỆN TẠI:
{current_css[:12000]}

TRẢ VỀ JSON:
{{"name": "Tên template", "html": "HTML body content", "css": "CSS content"}}
CHỈ TRẢ VỀ JSON."""

        response = await tool_instance.llm.ainvoke([
            SystemMessage(content="Bạn là worker review/repair template CV. Luôn trả về JSON hợp lệ."),
            HumanMessage(content=prompt),
        ])

        result = _parse_json_from_llm(response.content)
        current_name = result.get("name", current_name)
        current_html, current_css = _sanitize_template_artifacts(
            result.get("html", current_html),
            result.get("css", current_css),
        )
        errors = _validate_template_artifacts(current_html, current_css)

    if errors:
        raise ValueError(f"Template không hợp lệ sau {MAX_TEMPLATE_REPAIR_ATTEMPTS} lần sửa: {', '.join(errors[:3])}")

    return current_name, current_html, current_css


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
            state["activeWorker"] = "cv_designer"
            state["status"] = "running"
            state["currentStep"] = "Đang thiết kế CV HTML/CSS..."
            state["toolStatus"] = "generate_cv_template"
            state["cv_flow"] = "generating"
            state["step"] = "Đang tạo CV..."
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            # 3. Generate HTML/CSS with LLM
            try:
                html, css, name = await tool_instance._generate_with_llm(description, state, config)
                logger.info(f"[generate_template_node] Generated: {name}, html={len(html)}")
            except Exception as e:
                logger.error(f"[generate_template_node] Error: {e}")
                state["activeWorker"] = "cv_designer"
                state["status"] = "error"
                state["currentStep"] = "Không thể tạo CV."
                state["toolStatus"] = "generate_cv_template"
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
            state["current_template_id"] = None
            state["current_template_name"] = name
            state["current_template_html"] = html
            state["current_template_css"] = css
            state["activeWorker"] = "cv_designer"
            state["status"] = "waiting_user"
            state["currentStep"] = "CV đã tạo, chờ candidate xem preview."
            state["toolStatus"] = "generate_cv_template"
            state["cv_flow"] = "preview"
            state["step"] = "CV đã tạo! Xem preview."
            state["progress"] = 80

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

    async def _generate_with_llm(self, description: str, state: dict, config: RunnableConfig):
        if not self.llm:
            raise ValueError("LLM not configured")

        user_info = _build_user_context(state)

        prompt = f"""Bạn là chuyên gia thiết kế CV và frontend UI. Tạo template CV bằng HTML semantic + CSS chuyên nghiệp.

THÔNG TIN USER:
{user_info}

MÔ TẢ: {description}

YÊU CẦU BẮT BUỘC:
1. Trả HTML body content và CSS tách riêng.
2. Được dùng class CSS rõ nghĩa; hạn chế inline style trừ khi thật cần.
3. Dùng data-field markers: name, email, phone, address, degree, summary, skills, languages.
4. Sections dùng data-section và data-repeat, ví dụ data-section="education", data-repeat="education".
5. Dùng placeholders {{{{name}}}}, {{{{email}}}}, {{{{phone}}}}, {{{{address}}}}, {{{{degree}}}}, {{{{summary}}}}, {{{{skills}}}}, {{{{languages}}}}.
6. Repeat item placeholders dùng {{{{school}}}}, {{{{field}}}}, {{{{startYear}}}}, {{{{endYear}}}}, {{{{company}}}}, {{{{position}}}}, {{{{description}}}}, {{{{link}}}}.
7. Kích thước A4: container max-width: 210mm, min-height: 297mm, print-friendly.
8. Không dùng script, iframe, form, input, button, event handler, external assets.
9. Font stack: Inter, Arial, sans-serif.

THIẾT KẾ:
- Hãy thiết kế như một frontend designer thật: hierarchy rõ, spacing cân, typography đẹp, layout phù hợp vị trí ứng tuyển.
- Có thể dùng 1 cột, 2 cột, sidebar, header band, section cards nhẹ, timeline; chọn theo nội dung user.
- CSS phải tự chứa toàn bộ style cần thiết, gồm @media print nếu cần.
- Không render dữ liệu cá nhân thật nếu user chưa cung cấp; dùng placeholder.

TRẢ VỀ JSON:
{{{{"name": "Tên template", "html": "HTML body content", "css": "CSS content", "metadata": {{{{"layout": "single-column|two-column|minimal|creative|executive", "targetRole": "..."}}}}}}}}
CHỈ TRẢ VỀ JSON, KHÔNG giải thích."""

        response = await self.llm.ainvoke([
            SystemMessage(content="Bạn là chuyên gia thiết kế CV HTML/CSS. Luôn trả về JSON hợp lệ."),
            HumanMessage(content=prompt),
        ])

        result = _parse_json_from_llm(response.content)
        if "html" not in result:
            raise ValueError("Template không hợp lệ: thiếu HTML")
        name = result.get("name", "Custom Template")
        html = result["html"]
        css = result.get("css", "")
        return await _repair_template_if_needed(
            self,
            state,
            config,
            "generate_cv_template",
            name,
            html,
            css,
            extra_context="Đây là template CV mới cần được review trước khi lưu vào DB.",
        )


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
            state["activeWorker"] = "cv_designer"
            state["status"] = "running"
            state["currentStep"] = "Đang chỉnh sửa CV theo yêu cầu..."
            state["toolStatus"] = "adjust_cv_template"
            state["cv_flow"] = "editing"
            state["step"] = "Đang chỉnh sửa..."
            state["progress"] = 60
            await copilotkit_emit_state(config, state)

            # Adjust with LLM
            try:
                new_html, new_css, changes = await tool_instance._adjust_with_llm(current_html, current_css, adjustment, state, config)
                logger.info(f"[adjust_template_node] Adjusted: {changes}")
            except Exception as e:
                logger.error(f"[adjust_template_node] Error: {e}")
                state["activeWorker"] = "cv_designer"
                state["status"] = "error"
                state["currentStep"] = "Không thể chỉnh sửa CV."
                state["toolStatus"] = "adjust_cv_template"
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content=f"❌ Lỗi chỉnh sửa: {e}",
                )]
                return state

            # Update state
            state["current_template_name"] = state.get("current_template_name") or "AI Generated CV"
            state["current_template_html"] = new_html
            state["current_template_css"] = new_css
            state["activeWorker"] = "cv_designer"
            state["status"] = "waiting_user"
            state["currentStep"] = "CV đã chỉnh sửa, chờ candidate xem preview."
            state["toolStatus"] = "adjust_cv_template"
            state["cv_flow"] = "preview"
            state["step"] = "Đã chỉnh sửa!"
            state["progress"] = 85

            result_json = json.dumps({
                "name": state.get("current_template_name") or "AI Generated CV",
                "html": new_html,
                "css": new_css,
                "changes": changes,
            }, ensure_ascii=False)

            state["messages"] = [ToolMessage(
                tool_call_id=tool_call_id, name=tool_call["name"],
                content=result_json,
            )]

            await copilotkit_emit_state(config, state)
            return state

        node.__name__ = "adjust_template_node"
        return node

    async def _adjust_with_llm(self, current_html: str, current_css: str, adjustment: str, state: dict, config: RunnableConfig):
        if not self.llm:
            raise ValueError("LLM not configured")

        prompt = f"""Điều chỉnh template CV. Giữ nguyên data-field markers, placeholders và cấu trúc repeat sections.

HTML HIỆN TẠI:
{current_html[:12000]}

CSS HIỆN TẠI:
{current_css[:12000]}

YÊU CẦU: {adjustment}

TRẢ VỀ JSON: {{{{"html": "HTML body content", "css": "CSS content", "changes": "Mô tả"}}}}
CHỈ TRẢ VỀ JSON."""

        response = await self.llm.ainvoke([
            SystemMessage(content="Bạn là chuyên gia thiết kế CV. Luôn trả về JSON hợp lệ."),
            HumanMessage(content=prompt),
        ])

        result = _parse_json_from_llm(response.content)
        name = result.get("name", state.get("current_template_name") or "AI Generated CV")
        html = result["html"]
        css = result.get("css", current_css)
        repaired_name, repaired_html, repaired_css = await _repair_template_if_needed(
            self,
            state,
            config,
            "adjust_cv_template",
            name,
            html,
            css,
            extra_context="Template này đang được chỉnh sửa theo yêu cầu user. Giữ nguyên nội dung hợp lệ và chỉ sửa phần cần sửa.",
        )
        return repaired_html, repaired_css, result.get("changes", "Đã điều chỉnh")

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
    llm: Any = None

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

            if not tool_instance.api_client:
                raise ValueError("Không thể lưu CV: thiếu backend client để tạo template DB.")

            template_name = state.get("current_template_name") or title or "AI Generated CV"
            template_name, html, css = await _repair_template_if_needed(
                tool_instance,
                state,
                config,
                "save_resume",
                template_name,
                html,
                state.get("current_template_css", ""),
                extra_context="Template này sẽ được lưu vào DB. Phải pass validator backend trước khi tạo record.",
            )
            state["current_template_name"] = template_name
            state["current_template_html"] = html
            state["current_template_css"] = css

            template_payload = {
                "name": template_name,
                "description": f"Template CV AI cho {state.get('user_name', 'candidate')}",
                "htmlTemplate": html,
                "cssTemplate": css,
                "isPublic": False,
            }

            # Sync template, then save/update resume
            try:
                state["activeWorker"] = "cv_designer"
                state["status"] = "running"
                state["currentStep"] = "Đang lưu template và CV..."
                state["toolStatus"] = "save_resume"
                state["cv_flow"] = "saving"
                state["step"] = "Đang lưu CV..."
                state["progress"] = 75
                await copilotkit_emit_state(config, state)

                if state.get("current_template_id"):
                    await tool_instance.api_client.patch(
                        f"/resumes/templates/{state['current_template_id']}",
                        json=template_payload,
                    )
                    template_id = state["current_template_id"]
                else:
                    template_result = await tool_instance.api_client.post("/resumes/templates", json=template_payload)
                    template_id = _extract_api_id(template_result)
                    if not template_id:
                        raise ValueError("Backend không trả về templateId sau khi tạo template CV.")
                    state["current_template_id"] = template_id

                resume_data = _build_resume_data(state)
                resume_data["title"] = title
                resume_data["templateId"] = state["current_template_id"]

                if state.get("current_resume_id"):
                    result = await tool_instance.api_client.patch(
                        f"/resumes/{state['current_resume_id']}",
                        json=resume_data,
                    )
                else:
                    result = await tool_instance.api_client.post("/resumes", json=resume_data)

                resume_id = _extract_api_id(result)
                if not resume_id:
                    raise ValueError("Backend không trả về resumeId sau khi lưu CV.")
                state["current_resume_id"] = resume_id
            except Exception as e:
                logger.error(f"[save_resume_node] Error: {e}")
                state["activeWorker"] = "cv_designer"
                state["status"] = "error"
                state["currentStep"] = "Không thể lưu CV."
                state["toolStatus"] = "save_resume"
                state["messages"] = [ToolMessage(
                    tool_call_id=tool_call_id, name=tool_call["name"],
                    content=f"❌ Lỗi lưu CV: {e}",
                )]
                return state

            # Clean state after save
            state["activeWorker"] = "cv_designer"
            state["status"] = "done"
            state["currentStep"] = "CV đã lưu thành công."
            state["toolStatus"] = "save_resume"
            state["cv_flow"] = "done"
            state["step"] = "CV đã lưu thành công."
            state["progress"] = 100

            state["messages"] = [ToolMessage(
                tool_call_id=tool_call_id, name=tool_call["name"],
                content=f"Đã lưu CV thành công! Resume ID: {state.get('current_resume_id')}, Template ID: {state.get('current_template_id')}. Bạn muốn export PDF không?",
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
