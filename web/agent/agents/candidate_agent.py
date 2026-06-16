import json
import logging
from typing import Any, Literal, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import create_react_agent
from langgraph.types import Command
from langchain_mcp_adapters.client import MultiServerMCPClient

from agents.base_agent import BaseAgent
from core.api_client import ApiClient
from core.context import AgentContext
from core.prompts import (
    CANDIDATE_ADVISOR_SYSTEM_PROMPT,
    CANDIDATE_CV_SYSTEM_PROMPT,
    CANDIDATE_JOB_SYSTEM_PROMPT,
)
from schemas.candidate import CandidateAdvisorState, CandidateCvState, CandidateJobState
from tools.candidate.career_advisor import CareerAdvisorTool
from tools.candidate.search_jobs import SearchJobsTool

logger = logging.getLogger(__name__)


def _format_prompt(template: str, context: AgentContext) -> str:
    return template.format(
        user_id=context.user_id,
        user_name=context.user_name,
        skills=", ".join(context.skills or []),
        experience_years=context.experience_years or "Chưa rõ",
    )


class CandidateJobAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext):
        super().__init__(llm, context, ApiClient())

    def _register_tools(self) -> list:
        return [SearchJobsTool(api_client=self.api_client)]

    def _get_system_prompt(self) -> str:
        return _format_prompt(CANDIDATE_JOB_SYSTEM_PROMPT, self.context)

    def _get_state_class(self) -> type:
        return CandidateJobState

    def _get_lc_tools_for_toolnode(self) -> list:
        return []

    def _get_routing_map(self) -> dict:
        return {"search_jobs": "job_searcher_node"}

    def _add_custom_nodes(self, workflow):
        for tool in self.tools:
            workflow.add_node("job_searcher_node", tool.as_node())


class CandidateAdvisorAgent(BaseAgent):
    def __init__(self, llm: BaseChatModel, context: AgentContext):
        super().__init__(llm, context, ApiClient())

    def _register_tools(self) -> list:
        return [CareerAdvisorTool()]

    def _get_system_prompt(self) -> str:
        return _format_prompt(CANDIDATE_ADVISOR_SYSTEM_PROMPT, self.context)

    def _get_state_class(self) -> type:
        return CandidateAdvisorState

    def _get_lc_tools_for_toolnode(self) -> list:
        return []

    def _get_routing_map(self) -> dict:
        return {"analyze_candidate_dashboard": "career_advisor_node"}

    def _add_custom_nodes(self, workflow):
        for tool in self.tools:
            workflow.add_node("career_advisor_node", tool.as_node())


class CandidateCvAgent:
    """Candidate CV agent owns MCP connectivity instead of CopilotKit middleware."""

    def __init__(self, llm: BaseChatModel, context: AgentContext):
        self.llm = llm
        self.context = context
        self.system_prompt = _format_prompt(CANDIDATE_CV_SYSTEM_PROMPT, context)
        self.graph = self._build_graph()

    def _mcp_config(self) -> dict:
        # Hard-coded local MCP server for the candidate CV agent.
        return {"cv": {"url": "http://127.0.0.1:3108/sse", "transport": "sse"}}

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
            content = getattr(message, "content", None)
            normalized = self._normalize_template_result(content)
            if normalized:
                return normalized
        return None

    def _build_graph(self):
        async def chat_node(state: CandidateCvState, config: RunnableConfig) -> Command[Literal["__end__"]]:
            state["activeWorker"] = "cv_designer"
            state["status"] = "running"
            state["cv_flow"] = "generating"
            state["currentStep"] = "Đang kết nối CV MCP server..."
            state["toolStatus"] = "cv_mcp"
            state["progress"] = 20
            await copilotkit_emit_state(config, state)

            mcp_config = self._mcp_config()
            if not mcp_config:
                state["status"] = "error"
                state["cv_flow"] = "error"
                state["currentStep"] = "Chưa cấu hình CV_MCP_SERVER_URL."
                state["progress"] = 100
                await copilotkit_emit_state(config, state)
                return Command(
                    goto=END,
                    update={
                        "messages": [
                            AIMessage(content="Chưa cấu hình CV MCP server nên chưa thể tạo CV preview.")
                        ],
                        **state,
                    },
                )

            try:
                mcp_client = MultiServerMCPClient(mcp_config)
                tools = await mcp_client.get_tools()
                state["currentStep"] = "Đang tạo template CV bằng MCP tool..."
                state["progress"] = 55
                await copilotkit_emit_state(config, state)

                react_agent = create_react_agent(
                    self.llm,
                    tools,
                    prompt=self.system_prompt,
                )
                response = await react_agent.ainvoke({"messages": state.get("messages", [])})
                response_messages = response.get("messages", [])
                template = self._extract_template_from_messages(response_messages)

                update = {
                    "messages": response_messages,
                    "activeWorker": "cv_designer",
                    "status": "done",
                    "cv_flow": "preview" if template else "done",
                    "currentStep": "Đã tạo CV preview." if template else "Đã xử lý yêu cầu CV.",
                    "toolStatus": "cv_mcp",
                    "progress": 100,
                }
                if template:
                    update.update(
                        {
                            "current_template_name": template["name"],
                            "current_template_html": template["html"],
                            "current_template_css": template.get("css", ""),
                        }
                    )
                    # Compatibility with existing FE useRenderTool names/result shape.
                    response_messages = [
                        *response_messages,
                        ToolMessage(
                            tool_call_id="cv-mcp-preview",
                            name="generate_cv_template",
                            content=json.dumps(template, ensure_ascii=False),
                        ),
                    ]
                    update["messages"] = response_messages

                await copilotkit_emit_state(config, {**state, **update})
                return Command(goto=END, update=update)
            except Exception as exc:  # pragma: no cover - runtime integration guard
                logger.exception("CV MCP agent failed")
                state["status"] = "error"
                state["cv_flow"] = "error"
                state["currentStep"] = "Không thể tạo CV bằng MCP server."
                state["progress"] = 100
                await copilotkit_emit_state(config, state)
                return Command(
                    goto=END,
                    update={
                        "messages": [AIMessage(content=f"Không thể tạo CV bằng MCP server: {exc}")],
                        **state,
                    },
                )

        workflow = StateGraph(CandidateCvState)
        workflow.add_node("chat_node", chat_node)
        workflow.set_entry_point("chat_node")
        return workflow.compile()


# Compatibility alias for old /candidate imports. The alias is advisor by design.
CandidateAgent = CandidateAdvisorAgent
