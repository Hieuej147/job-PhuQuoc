import json
from typing import cast, Any, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool
from core.api_client import ApiClient
from core.config import get_settings

# Giới hạn số ứng viên đưa vào 1 lượt chấm điểm LLM — tránh prompt quá dài/tốn
# chi phí khi job có hàng trăm đơn ứng tuyển.
MAX_CANDIDATES_TO_ANALYZE = 30

RANKING_SYSTEM_PROMPT = """Bạn là chuyên gia tuyển dụng giàu kinh nghiệm.
Nhiệm vụ: đọc mô tả công việc (JD) và hồ sơ từng ứng viên, sau đó CHẤM ĐIỂM mức độ
phù hợp của mỗi ứng viên với công việc, theo thang điểm 0-100 (100 = phù hợp nhất).

Căn cứ chấm điểm: kỹ năng, kinh nghiệm, học vấn liên quan trực tiếp tới yêu cầu
công việc. Nếu ứng viên không có dữ liệu CV chi tiết (chỉ có cover letter hoặc
không có gì, ví dụ vì họ nộp CV dạng file PDF tải lên thay vì tạo CV trên hệ
thống), hãy chấm điểm thận trọng dựa trên thông tin ít ỏi đó, không tự bịa thêm
thông tin không có.

CHỈ trả về đúng 1 JSON object hợp lệ theo schema sau, KHÔNG kèm bất kỳ text nào
khác, KHÔNG dùng markdown code fence (```):
{
  "rankings": [
    {"application_id": "...", "score": 0-100, "reasoning": "1-2 câu tiếng Việt giải thích ngắn gọn vì sao"}
  ]
}
"""


def _unwrap_items(response: Any) -> list:
    """Bóc {"data": {...}} nhiều lớp cho tới khi tìm được list hoặc {items: [...]}."""
    current = response
    for _ in range(5):
        if isinstance(current, list):
            return current
        if isinstance(current, dict):
            if isinstance(current.get("items"), list):
                return current["items"]
            if "data" in current:
                current = current["data"]
                continue
        break
    return []


def _unwrap_data(response: Any) -> Any:
    """Bóc {"data": {...}} nhiều lớp cho tới khi gặp dict có "id" hoặc hết "data"."""
    result = response
    while isinstance(result, dict) and "id" not in result and "data" in result:
        result = result["data"]
    return result


def _format_resume_field(value: Any) -> str:
    """education/experience/projects là JSON (list các object) theo schema
    CandidateResume — chuyển thành text ngắn gọn để đưa vào prompt LLM."""
    if not value:
        return ""
    try:
        return json.dumps(value, ensure_ascii=False)
    except (TypeError, ValueError):
        return str(value)


class RankCandidatesInput(BaseModel):
    job_id: str = Field(description="ID của job")
    top_n: int = Field(default=5, description="Số lượng ứng viên top muốn lấy")


class RankCandidatesTool(BaseTool):
    name = "rank_candidates"
    description = (
        "Xếp hạng ứng viên theo mức độ phù hợp THẬT với job — dùng AI đọc và so "
        "sánh mô tả công việc (JD) với hồ sơ/CV từng ứng viên đã ứng tuyển, chấm "
        "điểm phù hợp và giải thích lý do. Trả về top N ứng viên điểm cao nhất."
    )
    args_schema = RankCandidatesInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client
        settings = get_settings()
        # Model riêng cho việc chấm điểm — tách khỏi LLM chính của agent (dùng để
        # trò chuyện) vì đây là 1 tác vụ phân tích độc lập, gọi 1 lần lấy JSON.
        self._scoring_llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )

    async def _heartbeat(
        self,
        state: Optional[dict],
        config: Optional[RunnableConfig],
        step_text: str,
        progress: int,
    ) -> None:
        """Phát tín hiệu state giữa các bước await dài (gọi backend, gọi LLM).

        LÝ DO: CopilotKit runtime coi 1 lượt chạy tool là "bị treo" nếu không
        thấy state được emit trong một khoảng thời gian (xem CopilotKit issue
        #2059 — "Timeout during long running tasks from langgraph agent"), rồi
        tự ngắt stream với lỗi missing_terminal_event/INCOMPLETE_STREAM — dù
        backend Python vẫn đang xử lý bình thường. Trước đây tool này chỉ emit
        đúng 2 lần (đầu/cuối), để lọt 1 khoảng "im lặng" dài bao gồm cả gọi
        backend lẫn gọi OpenAI — khoảng lặng đó đôi khi đủ dài để bị coi là
        treo. Hàm này chèn thêm "nhịp tim" sau mỗi bước, giữ kết nối "còn sống"
        trong mắt CopilotKit runtime.
        """
        if state is None or config is None:
            return
        state["currentStep"] = step_text
        state["progress"] = progress
        await copilotkit_emit_state(config, state)

    async def run(
        self,
        job_id: str,
        top_n: int = 5,
        state: Optional[dict] = None,
        config: Optional[RunnableConfig] = None,
    ) -> dict:
        try:
            # 1. Lấy JD của job
            job_response = await self.api_client.get(f"/jobs/{job_id}")
            job_data = _unwrap_data(job_response)
            if not isinstance(job_data, dict):
                job_data = {}

            await self._heartbeat(state, config, "Đang lấy danh sách ứng viên...", 65)

            # 2. Lấy danh sách ứng viên — dữ liệu CV (resume) đã được backend trả
            # kèm sẵn trong response này (xem ApplicationsService.findByJob:
            # include.resume.select gồm skills/education/experience/degree/...),
            # KHÔNG cần gọi thêm API /applications/:id/resume cho từng người.
            applications_response = await self.api_client.get(
                f"/applications/job/{job_id}",
                params={"limit": 100},
            )
            items = _unwrap_items(applications_response)
            items = [a for a in items if isinstance(a, dict)]

            if not items:
                return {"job_title": job_data.get("title"), "ranked_candidates": [], "total": 0}

            candidates_to_analyze = items[:MAX_CANDIDATES_TO_ANALYZE]

            # 3. Dựng prompt cho LLM
            job_summary = (
                f"Vị trí: {job_data.get('title', 'Không rõ')}\n"
                f"Mô tả: {job_data.get('description', '')}\n"
                f"Yêu cầu: {job_data.get('requirements', '')}\n"
            )

            candidates_text_parts = []
            for app in candidates_to_analyze:
                resume = app.get("resume") or {}
                lines = [
                    f"- application_id: {app.get('id')}",
                    f"  Tên: {app.get('user', {}).get('name', 'Không rõ')}",
                ]
                if app.get("coverLetter"):
                    lines.append(f"  Cover letter: {app.get('coverLetter')}")

                if resume:
                    if resume.get("degree"):
                        lines.append(f"  Bằng cấp: {resume.get('degree')}")
                    if resume.get("skills"):
                        lines.append(f"  Kỹ năng: {resume.get('skills')}")
                    if resume.get("education"):
                        lines.append(f"  Học vấn: {_format_resume_field(resume.get('education'))}")
                    if resume.get("experience"):
                        lines.append(f"  Kinh nghiệm: {_format_resume_field(resume.get('experience'))}")
                    if resume.get("projects"):
                        lines.append(f"  Dự án: {_format_resume_field(resume.get('projects'))}")
                elif app.get("cvUrl"):
                    lines.append("  Ghi chú: Ứng viên nộp CV dạng file PDF tải lên, chưa đọc được nội dung chi tiết.")

                if len(lines) == 2:
                    lines.append("  (Không có dữ liệu CV/cover letter nào khác)")
                candidates_text_parts.append("\n".join(lines))

            user_prompt = (
                f"MÔ TẢ CÔNG VIỆC:\n{job_summary}\n\n"
                f"DANH SÁCH ỨNG VIÊN ({len(candidates_to_analyze)} người):\n"
                + "\n\n".join(candidates_text_parts)
            )

            await self._heartbeat(
                state, config, f"Đang chấm điểm {len(candidates_to_analyze)} ứng viên bằng AI...", 80
            )

            # 4. Gọi LLM chấm điểm
            llm_response = await self._scoring_llm.ainvoke(
                [SystemMessage(content=RANKING_SYSTEM_PROMPT), HumanMessage(content=user_prompt)]
            )
            raw_content = llm_response.content if isinstance(llm_response.content, str) else str(llm_response.content)

            await self._heartbeat(state, config, "Đang tổng hợp kết quả xếp hạng...", 90)

            # Phòng trường hợp LLM lỡ bọc markdown fence dù đã dặn không làm vậy.
            cleaned = raw_content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
                score_map = {
                    r.get("application_id"): r
                    for r in parsed.get("rankings", [])
                    if isinstance(r, dict) and r.get("application_id")
                }
            except (json.JSONDecodeError, AttributeError):
                score_map = {}

            # 5. Gộp điểm số vào danh sách ứng viên, sắp xếp giảm dần theo score.
            def sort_key(app: dict):
                entry = score_map.get(app.get("id"))
                score = entry.get("score") if entry else None
                return -(score if isinstance(score, (int, float)) else -1)

            sorted_candidates = sorted(candidates_to_analyze, key=sort_key)

            ranked_candidates = []
            for i, app in enumerate(sorted_candidates[:top_n]):
                entry = score_map.get(app.get("id"), {})
                ranked_candidates.append(
                    {
                        "rank": i + 1,
                        "application_id": app.get("id"),
                        "user_name": app.get("user", {}).get("name"),
                        "status": app.get("status"),
                        "applied_at": app.get("createdAt"),
                        "score": entry.get("score"),
                        "reasoning": entry.get("reasoning"),
                    }
                )

            return {
                "job_title": job_data.get("title"),
                "ranked_candidates": ranked_candidates,
                "total": len(items),
                "analyzed": len(candidates_to_analyze),
            }
        except Exception as e:
            return {"error": str(e), "ranked_candidates": [], "total": 0}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "recruiter_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang đọc CV và chấm điểm mức độ phù hợp từng ứng viên..."
            state["toolStatus"] = "rank_candidates"
            state["progress"] = 60
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)
            result = await tool_instance.run(
                job_id=args.get("job_id"),
                top_n=args.get("top_n", 5),
                state=state,
                config=config,
            )

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = (
                "Đã xếp hạng xong ứng viên." if not result.get("error") else "Không thể xếp hạng ứng viên."
            )
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

        node.__name__ = "rank_candidates_node"
        return node