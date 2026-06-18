import json
import logging
from typing import Any, Optional, cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from pydantic import BaseModel, Field

from core.config import get_settings
from tools.base_tool import BaseTool

logger = logging.getLogger(__name__)


class GenerateCvTemplateInput(BaseModel):
    request: str = Field(description="Yêu cầu thiết kế CV của candidate")
    style: Optional[str] = Field(default=None, description="Phong cách CV mong muốn")


class CvTemplateTool(BaseTool):
    name = "generate_cv_template"
    description = (
        "Tạo hoặc chỉnh template CV dynamic qua MCP server. "
        "Dùng khi candidate muốn thiết kế CV, tạo CV preview, chỉnh layout, màu sắc hoặc template."
    )
    args_schema = GenerateCvTemplateInput

    def __init__(self, llm: BaseChatModel, system_prompt: str):
        self.llm = llm
        self.system_prompt = system_prompt

    def _mcp_config(self) -> dict:
        settings = get_settings()
        return {"cv": {"url": settings.cv_mcp_server_url, "transport": "sse"}}

    def _normalize_template_result(self, raw: Any) -> Optional[dict]:
        if raw is None:
            return None
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, dict) and item.get("type") == "text":
                    normalized = self._normalize_template_result(item.get("text"))
                    if normalized:
                        return normalized
            return None
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                return None
        if not isinstance(raw, dict):
            return None

        html = raw.get("html") or raw.get("htmlTemplate") or raw.get("html_template")
        css = raw.get("css") or raw.get("cssTemplate") or raw.get("css_template") or ""
        name = raw.get("name") or raw.get("title") or raw.get("templateName") or "CV Template"
        if not html:
            return None
        return {"name": name, "html": html, "css": css}

    def _extract_template_from_messages(self, messages: list) -> Optional[dict]:
        for message in reversed(messages):
            if isinstance(message, ToolMessage):
                normalized = self._normalize_template_result(message.content)
                if normalized:
                    return normalized
            normalized = self._normalize_template_result(getattr(message, "content", None))
            if normalized:
                return normalized
        return None

    async def run(self, request: str, style: Optional[str] = None) -> dict:
        messages = [
            (
                "user",
                "Tạo template CV theo yêu cầu sau. "
                "Kết quả tool cuối cùng phải có JSON gồm name, html, css.\n"
                f"Yêu cầu: {request}\nPhong cách: {style or 'tự chọn phù hợp'}",
            )
        ]
        return await self._run_with_messages(messages)

    async def _run_with_messages(self, messages: list) -> dict:
        try:
            mcp_client = MultiServerMCPClient(self._mcp_config())
            tools = await mcp_client.get_tools()
            react_agent = create_react_agent(self.llm, tools, prompt=self.system_prompt)
            response = await react_agent.ainvoke({"messages": messages})
            template = self._extract_template_from_messages(response.get("messages", []))
            if not template:
                return {"error": "MCP server không trả về template CV hợp lệ.", "messages": response.get("messages", [])}
            return template
        except Exception as exc:  # pragma: no cover - integration guard
            logger.exception("CV MCP tool failed")
            return {"error": f"Không thể tạo CV bằng MCP server: {exc}"}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "cv_designer"
            state["status"] = "running"
            state["cv_flow"] = "generating"
            state["currentStep"] = "Đang tạo template CV bằng MCP server..."
            state["toolStatus"] = "generate_cv_template"
            state["progress"] = 50
            await copilotkit_emit_state(config, state)

            request = args.get("request") or args.get("style") or "Tạo một template CV chuyên nghiệp"
            style = args.get("style")
            messages = [
                *state.get("messages", [])[:-1],
                (
                    "user",
                    "Tạo hoặc chỉnh template CV theo yêu cầu này. "
                    "Kết quả cuối cùng phải có JSON gồm name, html, css để FE preview.\n"
                    f"Yêu cầu: {request}\nPhong cách: {style or 'tự chọn phù hợp'}",
                ),
            ]
            result = await tool_instance._run_with_messages(messages)

            has_error = bool(result.get("error"))
            state["status"] = "error" if has_error else "done"
            state["cv_flow"] = "error" if has_error else "preview"
            state["currentStep"] = "Không thể tạo CV bằng MCP server." if has_error else "Đã tạo CV preview."
            state["progress"] = 100
            if not has_error:
                state["current_template_name"] = result["name"]
                state["current_template_html"] = result["html"]
                state["current_template_css"] = result.get("css", "")
            state["messages"] = [
                ToolMessage(
                    tool_call_id=tool_call_id,
                    name=tool_call["name"],
                    content=json.dumps(result, ensure_ascii=False, default=str),
                )
            ]
            await copilotkit_emit_state(config, state)
            return state

        node.__name__ = "cv_template_node"
        return node
