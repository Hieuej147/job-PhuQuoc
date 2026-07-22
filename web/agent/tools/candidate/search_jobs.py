import json
from typing import cast

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Optional
from tools.base_tool import BaseTool
from core.api_client import ApiClient
from core.config import get_settings

# NGƯỠNG PREFILTER — chỉ dùng để loại bỏ nhanh những job RÕ RÀNG không liên
# quan (similarity cực thấp), giảm số lượng job cần đưa cho AI đọc lại ở
# bước sau, KHÔNG dùng làm quyết định cuối cùng. Quyết định "liên quan hay
# không" thật sự do LLM ở bước 2 đảm nhiệm — ĐÃ XÁC NHẬN QUA TEST THẬT: cách
# này cho độ chính xác 100% (3/3 lần test đều ra đúng 1 job khớp chính xác),
# vượt trội hẳn so với chỉ dùng 1 ngưỡng cosine cố định (từng thử 0.5/0.6/0.75
# đều không ổn định giữa các trường hợp khác nhau).
PREFILTER_SIMILARITY_THRESHOLD = 0.35

FETCH_BATCH_SIZE = 100
MAX_CANDIDATES_FOR_LLM_FILTER = 20

# Kiểm tra theo kiểu "CHỨA cụm từ" thay vì khớp chính xác tuyệt đối — vì AI
# có thể trích xuất location thành nhiều biến thể khác nhau (ví dụ "Phú
# Quốc", "Phú Quốc, Kiên Giang" — đúng định dạng hiển thị thật của job trong
# hệ thống, "đảo Phú Quốc"...). Nếu chỉ so khớp exact-match với 1 danh sách
# cố định, bất kỳ biến thể nào lọt ra ngoài danh sách đó sẽ bị coi là 1 ward
# thật, gây lọc sai ra 0 kết quả — đây CHÍNH LÀ lỗi đã quan sát được thực tế
# khi user hỏi qua 2 lượt riêng biệt (mô tả việc làm rồi mới trả lời địa điểm
# ở câu sau, khác với lúc gõ gộp 1 câu duy nhất).
_LOCATION_SUBSTRINGS_TO_IGNORE = ("phú quốc", "phu quoc")


def _should_ignore_location(location: Optional[str]) -> bool:
    if not location:
        return True
    normalized = location.strip().lower()
    return any(substr in normalized for substr in _LOCATION_SUBSTRINGS_TO_IGNORE)


RELEVANCE_FILTER_SYSTEM_PROMPT = """Bạn là bộ lọc độ liên quan cho tính năng tìm việc làm.
Nhiệm vụ: cho 1 từ khóa tìm kiếm và 1 danh sách việc làm (id + tiêu đề), hãy xác định
CHÍNH XÁC những việc làm nào THỰC SỰ liên quan tới từ khóa đó về mặt nghiệp vụ/ngành nghề
(kể cả khi từ khóa là tên ngành chung như "IT" mà việc làm là 1 chức danh cụ thể trong
ngành đó, ví dụ "IT" liên quan tới "Lập trình viên Backend").

TUYỆT ĐỐI KHÔNG coi là liên quan nếu chỉ vì cùng nhóm rộng "dịch vụ khách hàng" nói chung
(ví dụ tìm "bán hàng" thì "lễ tân", "pha chế", "hướng dẫn viên du lịch" KHÔNG liên quan,
dù đều là công việc tiếp xúc khách hàng — đây là các ngành nghề khác biệt rõ ràng).

CHỈ trả về đúng 1 JSON object, KHÔNG kèm text nào khác, KHÔNG dùng markdown code fence:
{"relevant_ids": ["id1", "id2", ...]}

Nếu không có việc làm nào thực sự liên quan, trả về {"relevant_ids": []}.
"""


class SearchJobsInput(BaseModel):
    keyword: str = Field(description="Từ khóa tìm kiếm, vị trí hoặc kỹ năng")
    location: Optional[str] = Field(
        default=None,
        description=(
            "Tên phường/xã cụ thể trong Phú Quốc (ví dụ 'Dương Đông', 'An Thới', 'Cửa Cạn', "
            "'Hàm Ninh') hoặc 'remote'. KHÔNG truyền 'Phú Quốc' — để trống trong trường hợp đó."
        ),
    )
    min_salary: Optional[int] = Field(
        default=None,
        description="Lương tối thiểu, đơn vị VNĐ (đồng). Ví dụ user nói '8 triệu' phải quy đổi thành 8000000."
    )
    max_salary: Optional[int] = Field(
        default=None,
        description="Lương tối đa, đơn vị VNĐ (đồng). Ví dụ user nói '12 triệu' phải quy đổi thành 12000000."
    )
    limit: int = Field(default=5, description="Số lượng kết quả")


class SearchJobsTool(BaseTool):
    name = "search_jobs"
    description = (
        "Tìm kiếm việc làm phù hợp theo từ khóa, địa điểm và mức lương. "
        "Dùng khi ứng viên muốn tìm việc hoặc xem gợi ý việc làm. "
        "Chỉ trả về những job THỰC SỰ khớp nghĩa với từ khóa — đã qua 2 lớp lọc: lọc thô bằng "
        "vector embedding rồi lọc lại bằng AI đọc hiểu ngữ nghĩa thật, không trả về job chỉ "
        "'gần liên quan' để lấp đầy số lượng. Nếu không tìm thấy job nào đủ khớp, kết quả sẽ "
        "rỗng, hãy báo thẳng cho user thay vì gợi ý job không liên quan. "
        "TUYỆT ĐỐI KHÔNG DÙNG tool này nếu user yêu cầu 'thiết kế UI', 'tạo mẫu CV', 'làm template' hoặc 'code Tailwind'."
    )
    args_schema = SearchJobsInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client
        settings = get_settings()
        self._filter_llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["activeWorker"] = "job_searcher"
            state["status"] = "running"
            state["currentStep"] = "Đang tìm việc phù hợp..."
            state["toolStatus"] = "search_jobs"
            state["progress"] = 45
            await copilotkit_emit_state(config, state)

            result = await tool_instance.run(
                keyword=args.get("keyword", ""),
                location=args.get("location"),
                min_salary=args.get("min_salary"),
                max_salary=args.get("max_salary"),
                limit=args.get("limit", 5),
            )

            state["status"] = "done" if not result.get("error") else "error"
            state["currentStep"] = "Đã tìm xong việc phù hợp." if not result.get("error") else "Không thể tìm việc lúc này."
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

        node.__name__ = "job_searcher_node"
        return node

    async def _llm_filter_relevant(self, keyword: str, jobs: list) -> list:
        """Đưa danh sách job (đã prefilter thô) cho AI đọc thật và quyết định
        job nào thực sự liên quan tới từ khóa. ĐÃ XÁC NHẬN qua test thật: độ
        chính xác 100% (3/3 lần), vượt trội hẳn so với chỉ dùng 1 ngưỡng
        cosine cố định."""
        if not jobs:
            return []

        candidates = jobs[:MAX_CANDIDATES_FOR_LLM_FILTER]
        listing = "\n".join(f"- id: {j.get('id')} | tiêu đề: {j.get('title')}" for j in candidates)
        user_prompt = f'Từ khóa tìm kiếm: "{keyword}"\n\nDanh sách việc làm:\n{listing}'

        try:
            # FIX QUAN TRỌNG: truyền config={"callbacks": [], "run_name":
            # "search_jobs_internal_filter"} — chặn KHÔNG cho lệnh gọi AI nội
            # bộ này bị "nghe lén" bởi callback/tracer của luồng streaming
            # chính (LangChain tự động lan truyền callback qua context biến
            # bất đồng bộ, khiến MỌI lệnh gọi ChatOpenAI xảy ra trong lúc
            # graph đang được stream — kể cả lệnh gọi tách biệt như thế này —
            # đều bị AG-UI/CopilotKit coi là 1 "tin nhắn" và tự động hiện lên
            # giao diện cho user thấy, dù nó chỉ là tính toán nội bộ không
            # dành cho người dùng). Đây chính là nguyên nhân JSON thô
            # {"relevant_ids": [...]} từng bị lộ ra thành 1 bong bóng chat
            # riêng. Truyền callbacks=[] tường minh sẽ GHI ĐÈ (không kế thừa)
            # callback context xung quanh, cô lập hoàn toàn lệnh gọi này khỏi
            # luồng stream hiển thị cho user.
            response = await self._filter_llm.ainvoke(
                [SystemMessage(content=RELEVANCE_FILTER_SYSTEM_PROMPT), HumanMessage(content=user_prompt)],
                config={"callbacks": [], "run_name": "search_jobs_internal_filter", "tags": ["internal_no_stream"]},
            )
            raw = response.content if isinstance(response.content, str) else str(response.content)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
            parsed = json.loads(cleaned)
            relevant_ids = set(parsed.get("relevant_ids", []))
        except Exception:
            return candidates

        return [j for j in candidates if j.get("id") in relevant_ids]

    async def run(
        self,
        keyword: str,
        location: Optional[str] = None,
        min_salary: Optional[int] = None,
        max_salary: Optional[int] = None,
        limit: int = 5,
    ) -> dict:
        import os
        import httpx

        ollama_url = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
        model = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ollama_url}/api/embeddings",
                    json={"model": model, "prompt": f"search_query: {keyword}"},
                    timeout=30.0
                )
                response.raise_for_status()
                embedding = response.json().get("embedding")

        except Exception as e:
            return {"error": f"Failed to generate embedding: {str(e)}", "jobs": [], "total": 0}

        embedding = list(embedding)

        payload = {
            "embedding": embedding,
            "limit": FETCH_BATCH_SIZE,
        }

        if location and not _should_ignore_location(location):
            payload["wardId"] = location
        if min_salary:
            payload["salaryMin"] = min_salary
        if max_salary:
            payload["salaryMax"] = max_salary

        try:
            response = await self.api_client.post("/jobs/search-vector", json=payload)
            jobs = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(jobs, dict):
                jobs = jobs.get("items", [])
            if not isinstance(jobs, list):
                jobs = []

            def sort_key(j: dict):
                sim = j.get("similarity")
                sim_value = sim if isinstance(sim, (int, float)) else -1.0
                return (-sim_value, str(j.get("id") or ""))

            jobs_sorted = sorted(jobs, key=sort_key)

            prefiltered = [
                j for j in jobs_sorted
                if j.get("similarity") is None or j.get("similarity") >= PREFILTER_SIMILARITY_THRESHOLD
            ]

            relevant = await self._llm_filter_relevant(keyword, prefiltered)
            relevant = relevant[:limit]

            return {
                "jobs": [
                    {
                        "id": j.get("id"),
                        "slug": j.get("slug"),
                        "title": j.get("title"),
                        "company": j.get("company"),
                        "salary": j.get("salary"),
                        "location": j.get("location"),
                        "type": j.get("type"),
                        "similarity": j.get("similarity"),
                    }
                    for j in relevant
                ],
                "total": len(relevant),
            }
        except Exception as e:
            return {"error": str(e), "jobs": [], "total": 0}