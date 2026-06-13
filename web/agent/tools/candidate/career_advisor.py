import json
from typing import Any, Optional, cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool


class AnalyzeCandidateDashboardInput(BaseModel):
    focus: Optional[str] = Field(
        default=None,
        description="Điểm candidate muốn được tư vấn, ví dụ: CV, tìm việc, hồ sơ, applications.",
    )


class CareerAdvisorTool(BaseTool):
    name = "analyze_candidate_dashboard"
    description = (
        "Phân tích dashboard candidate để gợi ý bước tiếp theo. "
        "Dùng khi candidate hỏi nên làm gì tiếp theo, hồ sơ còn thiếu gì, hoặc muốn chiến lược tìm việc."
    )
    args_schema = AnalyzeCandidateDashboardInput

    async def run(self, focus: Optional[str] = None) -> dict:
        return {
            "worker": "career_advisor",
            "focus": focus,
            "message": "Đang phân tích dashboard candidate...",
        }

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})
            focus = args.get("focus")

            state["activeWorker"] = "career_advisor"
            state["status"] = "running"
            state["currentStep"] = "Đang phân tích dashboard candidate..."
            state["toolStatus"] = "analyze_candidate_dashboard"
            state["progress"] = 35
            await copilotkit_emit_state(config, state)

            result = tool_instance._analyze_context(state, focus)

            state["status"] = "done"
            state["currentStep"] = "Đã phân tích dashboard candidate."
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

        node.__name__ = "career_advisor_node"
        return node

    def _analyze_context(self, state: dict, focus: Optional[str]) -> dict:
        dashboard = self._extract_dashboard_context(state)
        checklist = dashboard.get("checklist") or []
        applications = dashboard.get("applications") or []
        saved_jobs = dashboard.get("savedJobs") or []
        resumes = dashboard.get("resumes") or []
        notifications = dashboard.get("notifications") or []
        completion_pct = dashboard.get("completionPct")

        missing_items = [
            item.get("label")
            for item in checklist
            if isinstance(item, dict) and item.get("done") is False and item.get("label")
        ]

        next_actions = []
        if missing_items:
            next_actions.append(f"Hoàn thiện hồ sơ: {missing_items[0]}")
        if not resumes:
            next_actions.append("Tạo hoặc cập nhật CV trước khi apply job mới")
        if saved_jobs:
            next_actions.append("Xem lại việc đã lưu và chọn 1-2 job phù hợp để apply")
        if applications:
            next_actions.append("Theo dõi trạng thái đơn ứng tuyển gần đây")
        if not next_actions:
            next_actions.append("Tìm job phù hợp với kỹ năng hiện tại")

        return {
            "worker": "career_advisor",
            "focus": focus,
            "profileCompletion": completion_pct,
            "summary": {
                "missingProfileItems": missing_items[:5],
                "applicationsCount": len(applications),
                "savedJobsCount": len(saved_jobs),
                "resumesCount": len(resumes),
                "notificationsCount": len(notifications),
            },
            "nextActions": next_actions[:5],
            "instruction": (
                "Hãy dùng dữ liệu này để trả lời ngắn gọn, cụ thể, "
                "ưu tiên hành động candidate nên làm tiếp theo."
            ),
        }

    def _extract_dashboard_context(self, state: dict) -> dict:
        context_items = state.get("copilotkit", {}).get("context", [])
        for item in context_items:
            value: Any
            if hasattr(item, "value"):
                value = item.value
            elif isinstance(item, dict):
                value = item.get("value")
            else:
                value = None

            if not isinstance(value, str):
                continue

            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                continue

            if isinstance(parsed, dict) and (
                "checklist" in parsed or "applications" in parsed or "savedJobs" in parsed
            ):
                return parsed

        return {}
