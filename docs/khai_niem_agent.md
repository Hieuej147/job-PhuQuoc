# TỔNG HỢP CÁC KHÁI NIỆM VỀ HỆ THỐNG AI AGENT

Tài liệu này giải thích các khái niệm, thuật ngữ và thư viện cốt lõi được sử dụng để xây dựng và vận hành hệ thống AI Agent trong dự án.

---

## 1. KHÁI NIỆM CHUNG VỀ AI AGENT

### 1.1. AI Agent (Tác nhân Trí tuệ nhân tạo)
Khác với Chatbot truyền thống chỉ trả lời câu hỏi dựa trên mẫu văn bản, **AI Agent** là một hệ thống tự trị sử dụng Mô hình ngôn ngữ lớn (LLM) làm "não bộ". Agent có khả năng:
* Nhận thức ngữ cảnh (hiểu câu hỏi của người dùng và trạng thái ứng dụng).
* Lập kế hoạch (chia nhỏ nhiệm vụ).
* Sử dụng công cụ (gọi các API, cơ sở dữ liệu để lấy hoặc sửa đổi dữ liệu).

### 1.2. Agentic Workflow (Quy trình làm việc lặp)
Là luồng hoạt động lặp đi lặp lại của Agent: **Suy nghĩ (Reasoning) $\rightarrow$ Hành động (Acting) $\rightarrow$ Quan sát (Observing)**. Agent sẽ không trả lời ngay mà sẽ gọi công cụ, nhận kết quả, phân tích tiếp rồi mới đưa ra câu trả lời cuối cùng cho người dùng.

---

## 2. KHÁI NIỆM VỀ FRAMEWORK LANGGRAPH

Dự án sử dụng **LangGraph** (thư viện mở rộng của LangChain) để xây dựng đồ thị hoạt động (Graph) cho Agent.

```
                  ┌──────────────┐
                  │  auth_node   │  (Node)
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
            ┌────►│  chat_node   │  (Node)
            │     └──────┬───────┘
            │            │
  (Edge)    │            ▼
            │     /──────────────\
            │    < should_continue > (Conditional Edge / Router)
            │     \──────────────/
            │        /        \
            │    (Tool Call)  (Tin nhắn text / Hết việc)
            │      /            \
      ┌─────┴────────┐        ┌──▼──────┐
      │  Tool Node   │        │ __end__ │
      └──────────────┘        └─────────┘
```

### 2.1. Đồ thị hoạt động (Graph / StateGraph)
Hệ thống AI Agent được thiết kế dưới dạng một đồ thị có hướng (Directed Graph). Trong đó dữ liệu sẽ đi qua các điểm nút và rẽ nhánh dựa trên điều kiện xác định.

### 2.2. Trạng thái (State)
Bộ nhớ dùng chung xuyên suốt đồ thị LangGraph (định nghĩa tại các file schema như `schemas/candidate.py`). Mọi Node trong đồ thị đều đọc thông tin từ State, xử lý và cập nhật kết quả ngược lại State. Trạng thái bao gồm:
* `messages`: Lịch sử cuộc hội thoại (HumanMessage, AIMessage, ToolMessage).
* `authorization`: Thông tin xác thực người dùng (token, cookie, user_id, vai trò).
* `activeWorker`, `progress`, `currentStep`: Trạng thái xử lý của công cụ hiện tại.

### 2.3. Nút (Node)
Là các hàm xử lý logic (hàm Python) đóng vai trò là các bước trong đồ thị.
* **`auth_node`**: Nút giải mã thông tin đăng nhập từ cookies/JWT gửi từ frontend để thiết lập kết nối an toàn với backend.
* **`chat_node`**: Nút đưa toàn bộ ngữ cảnh và lịch sử hội thoại cho LLM để đưa ra quyết định tiếp theo.
* **`tool_node`**: Nút đảm nhiệm việc chạy các công cụ (như tìm kiếm việc làm, cập nhật CV).

### 2.4. Cạnh (Edge) & Cạnh điều kiện (Conditional Edge)
* **Cạnh (Edge):** Đường nối cố định hướng đi trực tiếp từ Node này sang Node khác (VD: Từ `auth_node` $\rightarrow$ `chat_node`).
* **Cạnh điều kiện (Conditional Edge):** Bộ định tuyến (Router) quyết định rẽ nhánh dựa vào đầu ra của Node trước đó (VD: Kiểm tra xem LLM trả về text thông thường để kết thúc cuộc chat, hay trả về yêu cầu gọi tool để rẽ nhánh sang Tool Node).

### 2.5. Bộ lưu vết hội thoại (Checkpointer / MemorySaver)
Cơ chế lưu trữ trạng thái của LangGraph vào bộ nhớ hoặc DB theo từng `thread_id` (phiên chat). Nhờ Checkpointer, Agent có thể khôi phục hoàn toàn ngữ cảnh trò chuyện cũ mà không bị mất dấu khi người dùng tải lại trang.

---

## 3. KHÁI NIỆM VỀ COPILOTKIT (Giao thức Đồng bộ AI - Frontend)

**CopilotKit** là thư viện dùng để kết nối đồ thị AI Agent ở backend với giao diện React ở frontend.

### 3.1. CopilotRuntime
Dịch vụ chạy ở Next.js API Gateway đóng vai trò làm cổng trung chuyển. Nó nhận request đồng bộ từ giao diện chat và chuyển đổi thành giao thức tương thích gửi tới LangGraph FastAPI server.

### 3.2. LangGraphHttpAgent
Lớp proxy của CopilotKit giúp Next.js kết nối với server LangGraph Python thông qua giao thức HTTP streaming (Server-Sent Events - SSE).

### 3.3. useRenderTool
Hook React ở Frontend để đăng ký cách hiển thị UI Card cho một tool cụ thể khi tool đó thực thi hoàn tất. (VD: Đăng ký tool `search_jobs` để render giao diện danh sách công việc `JobListCard`).

### 3.4. copilotkit_emit_state
Hàm gửi tín hiệu trạng thái thời gian thực (real-time streaming) từ backend Python về frontend trình duyệt để cập nhật tiến trình (VD: hiển thị tiến độ 50%, đang chạy tác vụ gì) trong lúc tool backend đang xử lý nặng.

---

## 4. KHÁI NIỆM VỀ VECTOR SEARCH (Tìm kiếm Ngữ nghĩa)

Để tìm kiếm công việc thông minh, hệ thống sử dụng tìm kiếm vector thay vì tìm kiếm từ khóa thô (lexical search).

### 4.1. Vector Embedding (Nhúng Vector)
Là quá trình chuyển đổi một câu văn bản tự nhiên (VD: *"Lập trình viên NodeJS lương cao"*) thành một mảng các số thực (thường có độ dài 768 hoặc 1536 chiều) đại diện cho ý nghĩa ngữ nghĩa của câu đó. Dự án sử dụng model `nomic-embed-text` chạy cục bộ thông qua **Ollama**.

### 4.2. pgvector (Cơ sở dữ liệu Vector)
Là một tiện ích mở rộng (extension) cho PostgreSQL, cho phép lưu trữ trực tiếp các mảng số thực này vào cột dữ liệu và thực hiện tính toán độ tương đồng (Cosine Similarity hoặc L2 Distance) để tìm kiếm các công việc có ngữ nghĩa gần nhất với câu hỏi của ứng viên.
