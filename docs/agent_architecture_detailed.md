# KIẾN TRÚC VÀ CẨM NANG TOÀN TẬP VỀ HỆ THỐNG AI AGENT

Tài liệu này cung cấp cái nhìn chi tiết và chuyên sâu nhất về kiến trúc hệ thống, cấu hình môi trường, mã nguồn các lớp cốt lõi, sơ đồ trạng thái (state schemas) và cơ chế liên kết với giao diện trình duyệt của hệ thống AI Agent trong dự án.

---

## 1. TỔNG QUAN KIẾN TRÚC TOÀN DIỆN (SYSTEM ARCHITECTURE)

Hệ thống AI Agent được thiết kế dưới dạng **Modular Agentic Architecture**, phối hợp chặt chẽ giữa 4 lớp:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WEB CLIENT (FRONTEND)                           │
│  - Giao diện chat (global-ai-chat-widget.tsx)                           │
│  - Bắt giữ context & Render UI Cards đẹp mắt (useRenderTool)           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Giao thức HTTP/SSE)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BFF (NEXT.JS API ROUTE)                         │
│  - Middleware API Gateway (/api/copilotkit/[[...slug]]/route.ts)       │
│  - Định tuyến phiên đăng nhập & Chuyển tiếp State                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Proxy HTTP)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    AGENT SERVICE (PYTHON FASTAPI)                      │
│  - Động cơ LangGraph (Đồ thị StateGraph luồng chạy)                   │
│  - Core Nodes (auth_node, chat_node, tool_nodes)                       │
└────────────────┬─────────────────┬───────────────────┬─────────────────┘
                 │                 │                   │
                 ▼                 ▼                   ▼
┌────────────────────────┐┌────────────────┐┌────────────────────────────┐
│    NESTJS BACKEND      ││ OLLAMA SERVICE ││  DATABASE POSTGRESQL       │
│  - Quản lý dữ liệu DB  ││ - Model:       ││ - pgvector: Lưu & Tìm kiếm │
│  - API v1 (/resumes...)││ nomic-embed... ││   vector tương đồng        │
└────────────────────────┘└────────────────┘└────────────────────────────┘
```

### Sơ đồ cấu trúc thư mục của Agent (`web/agent`)
```
web/agent/
├── agents/
│   ├── __init__.py
│   ├── base_agent.py          # Lớp cơ sở định nghĩa cấu trúc đồ thị Graph chung
│   ├── candidate_agent.py     # Định nghĩa Agent Ứng viên & các tool đi kèm
│   └── recruiter_agent.py     # Định nghĩa Agent Nhà tuyển dụng & các tool đi kèm
├── core/
│   ├── agent_factory.py       # Khởi tạo đồ thị Agent tương ứng
│   ├── api_client.py          # HTTP Client bọc httpx gọi API NestJS có Token/Cookie
│   ├── checkpointer.py        # Lưu session chat Postgres (AsyncPostgresSaver)
│   ├── config.py              # Đọc cấu hình từ file .env
│   └── prompts.py             # Hệ thống System Prompts điều hướng LLM
├── schemas/
│   ├── candidate.py           # Định nghĩa State dùng chung cho Candidate Agent
│   └── recruiter.py           # Định nghĩa State dùng chung cho Recruiter Agent
├── tools/
│   ├── candidate/             # Chứa code các tool phía Ứng viên
│   └── recruiter/             # Chứa code các tool phía Nhà tuyển dụng
├── main.py                    # Khởi chạy FastAPI App & Đăng ký Endpoint API
└── pyproject.toml             # Cấu hình package & dependencies dự án
```

---

## 2. CẤU HÌNH MÔI TRƯỜNG & KHAI BÁO DEPENDENCIES

### 2.1. Phân tích Dependencies (`pyproject.toml`)
Dự án sử dụng Python $\ge$ 3.11 với các thư viện cốt lõi sau:
* **`copilotkit` ($\ge$ 0.1.74):** Thư viện đồng bộ hóa trạng thái ứng dụng thời gian thực giữa Web và AI.
* **`ag-ui-langgraph` ($\ge$ 0.0.22):** Tiện ích mở rộng tích hợp giao diện LangGraph vào FastAPI.
* **`langgraph` ($\ge$ 1.0.1):** Framework xây dựng Agent dạng đồ thị trạng thái tuần hoàn (Stateful Multi-Actor).
* **`langchain` & `langchain-openai`:** Thư viện giao tiếp với GPT-4o-mini và quản lý prompt.
* **`httpx`:** Thư viện gửi request HTTP phi tuần tự (async) để gọi NestJS Backend.
* **`langgraph-checkpoint-postgres` & `psycopg`:** Hỗ trợ ghi lại vết hội thoại và lưu vào PostgreSQL.

### 2.2. Các biến môi trường cần thiết (`.env`)
```bash
# OpenAI Key để chạy trí tuệ nhân tạo
OPENAI_API_KEY=sk-proj-...

# Kết nối database dùng để lưu vết hội thoại (Checkpointer)
DATABASE_URL=postgresql://pq_user:pq_pass123@localhost:5435/pq_jobs

# Dịch vụ nhúng vector cục bộ
OLLAMA_URL=http://127.0.0.1:11434
EMBEDDING_MODEL=nomic-embed-text

# Cổng khởi chạy Agent Python (FastAPI)
AGENT_PORT=8125
```

---

## 3. PHÂN TÍCH SOURCE CODE CỦA CÁC CORE CLASSES

### 3.1. Lớp Cơ Sở `BaseAgent` (`agents/base_agent.py`)
Đây là trái tim điều khiển luồng đi của mọi Agent. Lớp này xây dựng đồ thị hoạt động thông qua LangGraph.

#### A. Sắp xếp thứ tự ToolMessage để tránh lỗi OpenAI API
Khi LLM OpenAI gọi tool, yêu cầu bắt buộc là mọi tin nhắn dạng `AIMessage` có yêu cầu gọi công cụ (`tool_calls`) phải được phản hồi ngay lập tức bằng `ToolMessage` tương ứng. Nếu thứ tự tin nhắn bị đảo lộn (do merge checkpoint), OpenAI sẽ trả lỗi 400 và làm crash ứng dụng.
Hàm `sanitize_tool_message_order` thực hiện nhiệm vụ sắp xếp lại danh sách tin nhắn:
```python
def sanitize_tool_message_order(messages: list) -> list:
    tool_messages_by_id = {m.tool_call_id: m for m in messages if isinstance(m, ToolMessage) and m.tool_call_id}
    result = []
    consumed_tool_ids = set()
    for m in messages:
        if isinstance(m, ToolMessage):
            continue
        result.append(m)
        if isinstance(m, AIMessage) and m.tool_calls:
            for tc in m.tool_calls:
                tc_id = tc.get("id") or getattr(tc, "id", None)
                if not tc_id or tc_id in consumed_tool_ids:
                    continue
                consumed_tool_ids.add(tc_id)
                if tc_id in tool_messages_by_id:
                    result.append(tool_messages_by_id[tc_id])
                else:
                    # Tự tạo ToolMessage rỗng dự phòng nếu tool bị mồ côi (chưa hoàn thành) để tránh crash
                    tc_name = tc.get("name") or getattr(tc, "name", "unknown")
                    result.append(ToolMessage(tool_call_id=tc_id, name=tc_name, content="Không có kết quả."))
    return result
```

#### B. Xác thực thông tin qua `auth_node`
Mỗi khi cuộc chat gửi lên, `auth_node` sẽ chạy đầu tiên để lấy Cookies/JWT gán vào API Client:
```python
async def auth_node(state: Any, config: RunnableConfig) -> Command:
    cookie = config.get("configurable", {}).get("cookie")
    auth_token = config.get("configurable", {}).get("authorization")
    if cookie:
        state["authorization"] = {"cookie": cookie, "user_id": "authenticated"}
        if self.api_client:
            self.api_client.set_cookie(cookie)
    elif auth_token:
        user_info = decode_jwt(auth_token)
        if user_info:
            state["authorization"] = {**user_info, "token": auth_token}
            if self.api_client:
                self.api_client.set_auth_token(auth_token)
    ...
    return Command(goto="chat_node", update={"authorization": state["authorization"]})
```

---

### 3.2. Lớp Kết Nối An Toàn `ApiClient` (`core/api_client.py`)
Gói gọn `httpx.AsyncClient` để bảo vệ các lượt gọi API bảo mật đến NestJS. Mỗi khi API Client được gọi, nó tự động đính kèm Cookie/Token xác thực đã thu thập được từ bước `auth_node`:
```python
def _get_headers(self, headers: Optional[Dict] = None) -> Dict:
    h = {"Content-Type": "application/json"}
    if self._cookie:
        h["Cookie"] = self._cookie
    elif self._auth_token:
        h["Authorization"] = self._auth_token
    if headers:
        h.update(headers)
    return h
```

---

### 3.3. Cơ chế Lưu Vết Phiên Chat `Checkpointer` (`core/checkpointer.py`)
Hệ thống sử dụng **`AsyncPostgresSaver`** để lưu trữ trạng thái đồ thị trực tiếp vào PostgreSQL. Điều này giúp hệ thống lưu trữ lâu dài phiên hội thoại của người dùng, không bị mất khi server khởi động lại hoặc khi ứng dụng bị tắt ngang.

---

## 4. PHÂN TÍCH CHI TIẾT SƠ ĐỒ TRẠNG THÁI (STATE SCHEMAS)

Trạng thái (State) đóng vai trò là bộ nhớ trung tâm của Agent trong suốt phiên làm việc.

### 4.1. Sơ đồ trạng thái của Ứng viên (`schemas/candidate.py`)
Candidate Agent cần quản lý luồng hội thoại rất phức tạp (lưu thông tin CV, chọn mẫu, tìm việc) nên State của nó theo dõi rất nhiều biến:
* **Biến Tiến Trình (Shared Progress):**
  * `activeWorker`: Nhãn xử lý hiện tại (VD: `job_searcher`, `cv_manager`, `cv_designer`).
  * `progress` & `currentStep`: Tiến độ thời gian thực dạng số % và text hiển thị lên thanh tiến trình.
  * `status`: Trạng thái chạy (`thinking`, `running`, `done`, `error`).
* **Thông Tin Thu Thập (CV Information Fields):**
  * Lưu trữ dữ liệu thô người dùng chat (họ tên, email, sđt, học vấn, kinh nghiệm, kỹ năng, dự án...) để chuẩn bị đóng gói tạo CV.
* **Đồng Bộ HTML/CSS (`current_template_html`/`current_template_css`):**
  * Lưu trữ mã nguồn mẫu thiết kế CV tạm thời để đồng bộ sang giao diện xem trước CV (Iframe) trên trình duyệt.

### 4.2. Sơ đồ trạng thái của Nhà tuyển dụng (`schemas/recruiter.py`)
Recruiter Agent xử lý các tác vụ ít trạng thái trung gian hơn, do đó schema chỉ cần kế thừa `CopilotKitState` để lưu lịch sử hội thoại và lưu thêm thông tin xác thực phiên đăng nhập (`authorization`).

---

## 5. CƠ CHẾ ĐỒNG BỘ GIAO DIỆN (FRONTEND BINDINGS)

### 5.1. Cơ chế phát tín hiệu tiến độ (`copilotkit_emit_state`)
Trong lúc một Node của Python đang tính toán nặng (VD: gọi API lấy dữ liệu), nó sử dụng hàm `copilotkit_emit_state` để phát tin hiệu SSE về Frontend:
```python
state["currentStep"] = "Đang tìm việc phù hợp..."
state["progress"] = 45
await copilotkit_emit_state(config, state)
```
Frontend sẽ lập tức cập nhật giao diện của bong bóng trạng thái chat để báo cho người dùng biết AI đang làm việc gì mà không gây cảm giác ứng dụng bị treo.

### 5.2. Các Bộ Render UI (Renderers)
Frontend đón nhận kết quả JSON trả về từ các tool thông qua hook `useRenderTool` và render ra các component giao diện tương ứng thay thế cho text thô:

1. **Giao diện tìm việc làm (`useJobSearchRenderer`):**
   * Bắt sự kiện chạy thành công của tool `search_jobs`.
   * Lấy danh sách jobs trả về dựng lên component `JobListCard` hiển thị chức vụ, công ty, mức lương, kèm nút xem chi tiết.
2. **Giao diện quản lý CV (`useCvToolsRenderer`):**
   * Bắt sự kiện của `save_cv` $\rightarrow$ Render thẻ kết quả lưu CV (`SaveCvResultCard`) kèm link xem chi tiết.
   * Bắt sự kiện của `list_my_cvs` $\rightarrow$ Render các nút lựa chọn CV (`CvListCard`).
   * Bắt sự kiện của `get_cv_detail` $\rightarrow$ Render thẻ chi tiết CV (`CvDetailCard`).
3. **Giao diện xem trước CV (`useTemplateRenderer`):**
   * Đón nhận mã nguồn HTML/CSS động từ các tool liên quan đến thiết kế CV và hiển thị trực tiếp lên Iframe xem trước CV (`CVPreviewInline`) nằm bên cạnh khung chat.

---

## 6. DANH SÁCH TOÀN BỘ 12 TOOLS ĐÃ XÂY DỰNG

Dưới đây là danh sách đầy đủ toàn bộ 12 tools đang chạy ở phía Agent Backend:

| Tên Tool | File Coded phía Agent | API Backend của NestJS | Trạng thái hiển thị ở Trình duyệt (Frontend) |
| :--- | :--- | :--- | :--- |
| **`search_jobs`** | [search_jobs.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/search_jobs.py) | `POST /jobs/search-vector` | **Đã có UI:** Dựng danh sách thẻ công việc (`JobListCard`). |
| **`save_cv`** | [save_cv.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/save_cv.py) | `POST /resumes` & `PATCH /resumes/{id}` | **Đã có UI:** Hiện thẻ báo thành công (`SaveCvResultCard`). |
| **`list_my_cvs`** | [list_my_cvs.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/list_my_cvs.py) | `GET /resumes/my` | **Đã có UI:** Hiện danh sách CV hàng dọc (`CvListCard`). |
| **`get_cv_detail`** | [get_cv_detail.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/get_cv_detail.py) | `GET /resumes/{id}` | **Đã có UI:** Hiện tóm tắt nội dung CV (`CvDetailCard`). |
| **`choose_cv_template`**| [choose_cv_template.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/choose_cv_template.py) | `GET /resumes/templates` | **Chưa có UI Card:** AI liệt kê danh sách bằng chữ đánh số thứ tự. |
| **`analyze_candidate_dashboard`**| [career_advisor.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/career_advisor.py) | Context gửi trực tiếp từ Frontend | **Chưa có UI Card:** AI đọc context rồi tự chat để tư vấn lộ trình. |
| **`get_candidates`** | [get_candidates.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/get_candidates.py) | `GET /applications/job/{job_id}` | **Chưa có UI Card:** AI chat liệt kê danh sách ứng viên (tên, email). |
| **`rank_candidates`** | [rank_candidates.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/rank_candidates.py) | `GET /applications/job/{job_id}` & `GET /jobs/{id}` | **Chưa có UI Card:** AI hiển thị thứ tự xếp hạng dạng văn bản đánh số. |
| **`update_application_status`**| [update_application_status.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/update_application_status.py) | `PATCH /applications/{id}/status` | **Chưa có UI Card:** AI thông báo trạng thái cập nhật mới qua chat. |
| **`draft_email`** | [draft_email.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/draft_email.py) | Soạn mẫu offline cục bộ | **Chưa có UI Card:** Văn bản thư mẫu gửi ra chat để người dùng tự copy. |
| **`get_categories`** | [get_categories.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/get_categories.py) | `GET /categories` | **Chưa có UI Card:** AI liệt kê các danh mục bằng chữ trong cuộc chat. |
| **`create_job`** | [create_job.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/create_job.py) | `POST /jobs` | **Chưa có UI Card:** AI gửi tin nhắn chúc mừng kèm thông tin nháp. |
