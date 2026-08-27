# TÀI LIỆU TỔNG HỢP TOÀN BỘ CÁC KHÁI NIỆM & KIẾN THỨC CẦN NẮM ĐỂ LÀM AI AGENT

Tài liệu này hệ thống hóa toàn bộ các kiến thức nền tảng và nâng cao cần nắm để xây dựng, vận hành và bảo trì hệ thống AI Agent trong dự án **Phú Quốc Jobs**. Các kiến thức được chia làm 6 phân vùng công nghệ cụ thể dưới đây.

---

## 1. NỀN TẢNG VỀ AI AGENT & LLM (LLM & Agent Fundamentals)

### 1.1. LLM (Large Language Model - Mô hình ngôn ngữ lớn)
*   **Khái niệm:** Là các mô hình trí tuệ nhân tạo được huấn luyện trên lượng dữ liệu văn bản khổng lồ để hiểu, sinh và xử lý ngôn ngữ tự nhiên. Ví dụ: `gpt-4o`, `gpt-4o-mini`, `gemini-1.5-pro`...
*   **Vai trò:** Đóng vai trò là "não bộ" của Agent. LLM tiếp nhận prompt (chỉ thị), lịch sử chat, và ngữ cảnh để đưa ra quyết định hành động tiếp theo bằng văn bản hoặc gọi công cụ.

### 1.2. AI Agent (Tác nhân AI)
*   **Khái niệm:** Khác với Chatbot thông thường (chỉ đối thoại dựa trên tập luật cứng hoặc trả lời hỏi-đáp tĩnh), **AI Agent** là một thực thể lập trình tự trị sử dụng LLM để tự động đưa ra quyết định, lập kế hoạch, và tương tác với môi trường bên ngoài thông qua các công cụ (tools/APIs).
*   **Đặc điểm:** Agent có khả năng tự sửa lỗi, tự lập luận (reasoning) và chạy nhiều vòng lặp suy nghĩ - hành động cho đến khi giải quyết xong yêu cầu của người dùng.

### 1.3. Agentic Workflow & ReAct Pattern (Quy trình làm việc lặp)
*   **Khái niệm:** Quy trình hoạt động của Agent tuân theo mẫu **ReAct (Reason + Act)**:
    1.  **Reason (Suy nghĩ):** LLM phân tích câu hỏi của người dùng và lập kế hoạch (VD: *"Tôi cần tìm các công việc IT tại Dương Đông và lọc theo mức lương"*).
    2.  **Act (Hành động):** LLM sinh ra yêu cầu gọi một công cụ cụ thể (VD: gọi `search_jobs` với tham số phù hợp).
    3.  **Observe (Quan sát):** Agent chạy công cụ, nhận kết quả JSON từ API và trả kết quả đó lại cho LLM để phân tích tiếp.
    Luồng này lặp đi lặp lại cho đến khi LLM có đủ thông tin để trả lời người dùng.

### 1.4. Tool Calling / Function Calling (Gọi công cụ)
*   **Khái niệm:** Là khả năng của LLM nhận diện khi nào cần gọi một hàm/API ngoài. Thay vì trả về văn bản hội thoại thông thường, LLM sẽ trả về cấu trúc dữ liệu JSON chứa tên hàm và các đối số (arguments) tương ứng.
*   **Vai trò:** Giúp kết nối AI Agent với cơ sở dữ liệu và hệ thống API nghiệp vụ thực tế của dự án Phú Quốc Jobs.

---

## 2. QUẢN LÝ ĐỒ THỊ HOẠT ĐỘNG VỚI LANGGRAPH (Agentic Orchestration)

Khi logic của Agent trở nên phức tạp (cần phân quyền, kiểm soát luồng đi chặt chẽ), việc sử dụng các chuỗi tuyến tính (chains) thông thường là không đủ. Dự án sử dụng **LangGraph** để cấu trúc Agent thành một Máy trạng thái tuần hoàn (State Machine).

```
                      ┌──────────────┐
                      │  auth_node   │  (Bước 1: Xác thực)
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                ┌────►│  chat_node   │◄─┐ (Bước 2: LLM lập kế hoạch)
                │     └──────┬───────┘  │
                │            │          │
      (Edge)    │            ▼          │
                │     /──────────────\  │
                │    < should_continue >│ (Bước 3: Định tuyến điều kiện)
                │     \──────────────/  │
                │        /        \     │ (Nếu có Tool Call)
                │    (Text Chat) (Tool Node)
                │      /            \   │
          ┌─────┴────────┐        ┌──▼──┴──┐
          │   __end__    │        │Node của│ (Bước 4: Thực thi tool)
          └──────────────┘        │từngTool│
                                  └────────┘
```

### 2.1. StateGraph (Đồ thị Trạng thái)
*   **Khái niệm:** Là lớp cốt lõi của LangGraph để định nghĩa sơ đồ hoạt động. Đồ thị gồm các Nút (Nodes) kết nối với nhau bởi các Cạnh (Edges).
*   **Ứng dụng trong dự án:** Định nghĩa tại [base_agent.py:L287](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/agents/base_agent.py#L287) để liên kết luồng từ xác thực (`auth_node`) $\rightarrow$ hội thoại AI (`chat_node`) $\rightarrow$ điều hướng chạy tool $\rightarrow$ quay lại hội thoại.

### 2.2. Agent State (Trạng thái Agent)
*   **Khái niệm:** Bộ nhớ dùng chung (Shared memory) lưu trữ trạng thái hiện tại của toàn bộ đồ thị. Mỗi node khi chạy sẽ nhận đầu vào là State hiện tại và trả về bản cập nhật cho State đó.
*   **Ứng dụng trong dự án:** Định nghĩa tại [schemas/candidate.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/schemas/candidate.py) và [schemas/recruiter.py](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/schemas/recruiter.py). State chứa lịch sử chat (`messages`), thông tin xác thực (`authorization`), và các biến giao diện (`activeWorker`, `currentStep`, `progress`, `cv_flow`...).

### 2.3. Nodes (Nút tính toán)
*   **Khái niệm:** Là các hàm Python thực thi một bước xử lý trong đồ thị.
*   **Các Node chính trong dự án:**
    *   `auth_node`: Đọc cookie xác thực để thiết lập phiên làm việc ([base_agent.py:L172](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/agents/base_agent.py#L172)).
    *   `chat_node`: Nạp prompt hệ thống và gọi LLM OpenAI để quyết định hướng đi ([base_agent.py:L210](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/agents/base_agent.py#L210)).
    *   *Custom Tool Nodes*: Hệ thống bọc mỗi tool backend thành một Node riêng biệt thông qua phương thức `as_node()` để cập nhật tiến trình chạy lên frontend và quản lý session cookie an toàn (VD: `job_searcher_node`, `rank_candidates_node`, `cv_template_node`).

### 2.4. Edges & Conditional Edges (Cạnh định tuyến)
*   **Cạnh thông thường (Edge):** Nối cứng luồng đi từ Node này qua Node khác.
*   **Cạnh điều kiện (Conditional Edge):** Sử dụng một hàm định tuyến (router function) để quyết định Node tiếp theo dựa trên dữ liệu hiện tại của State. Trong dự án, hàm `should_continue` ([base_agent.py:L151](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/agents/base_agent.py#L151)) đóng vai trò router:
    *   Nếu LLM gọi tool: chuyển hướng sang Node thực thi của Tool đó.
    *   Nếu LLM trả lời text bình thường: chuyển hướng kết thúc hội thoại (`__end__`).

### 2.5. Checkpointer & Thread ID (Bộ lưu vết và Phân tách phiên chat)
*   **Khái niệm:** LangGraph sử dụng Checkpointer để tự động lưu lại ảnh chụp trạng thái (snapshot) của State sau mỗi bước chạy đồ thị. Mỗi phiên chat được định danh bằng một `thread_id`.
*   **Ứng dụng trong dự án:** Sử dụng `langgraph-checkpoint-postgres` ([main.py:L50](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/main.py#L50)) kết nối trực tiếp vào database PostgreSQL để lưu trữ vĩnh viễn lịch sử chat và trạng thái Agent của người dùng.

### 2.6. Recursion Limit (Giới hạn đệ quy)
*   **Khái niệm:** Số bước chạy tối đa cho phép của đồ thị trong một lượt tương tác.
*   **Ứng dụng trong dự án:** Được cấu hình tại constructor của Agent trong [main.py:L68](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/main.py#L68) với giới hạn `12` bước. Điều này bảo vệ hệ thống khỏi việc LLM bị lặp vô tận (infinte loop) khi liên tục gọi tool lỗi hoặc không tự dừng được.

---

## 3. GIAO TIẾP ĐỒNG BỘ AI - UI VỚI COPILOTKIT (AI-to-UI Integration)

**CopilotKit** là framework giúp lập trình viên React kết nối trực tiếp giao diện người dùng với Agent backend thông qua cơ chế đồng bộ trạng thái hai chiều.

### 3.1. CopilotRuntime & LangGraphHttpAgent
*   **CopilotRuntime:** Đóng vai trò là API Gateway chạy ở BFF Next.js ([route.ts:L44](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/app/api/copilotkit/[[...slug]]/route.ts#L44)). Nó trung chuyển tin nhắn từ client và phân phối đến đúng luồng Agent Python thích hợp (`/candidate` hoặc `/recruiter`).
*   **LangGraphHttpAgent:** Lớp tích hợp sẵn của CopilotKit giúp Next.js gọi và nhận stream (Server-Sent Events - SSE) từ các endpoint của FastAPI Agent Server.

### 3.2. Real-time State Streaming (`copilotkit_emit_state`)
*   **Khái niệm:** Hàm gửi các bản cập nhật trạng thái tạm thời từ backend Python về frontend trình duyệt ngay trong lúc Agent đang thực thi logic nặng mà chưa hoàn thành lượt chạy đồ thị.
*   **Ứng dụng trong dự án:** Xem tại [search_jobs.py:L117](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/search_jobs.py#L117) và [rank_candidates.py:L121](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/recruiter/rank_candidates.py#L121). Khi tool đang tìm kiếm dữ liệu hoặc gọi LLM chấm điểm, Agent liên tục cập nhật:
    ```python
    state["currentStep"] = "Đang đọc CV và chấm điểm..."
    state["progress"] = 60
    await copilotkit_emit_state(config, state)
    ```
    Giúp giao diện chat React hiển thị thanh tiến trình (%) và dòng mô tả sinh động.

### 3.3. Custom UI Renderers (`useRenderTool` & Zod Schema)
*   **Khái niệm:** Hook của CopilotKit chạy ở client React để ghi đè (override) cách hiển thị mặc định của tin nhắn dạng text thô thành giao diện UI chuyên biệt (HTML Card) khi nhận được kết quả JSON từ một tool.
*   **Ứng dụng trong dự án:** Định nghĩa tại các file như [blog-tools-renderer.tsx](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/components/ai/renderers/blog-tools-renderer.tsx) hay [job-tools-renderer.tsx](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/components/ai/renderers/job-tools-renderer.tsx). Hook khai báo schema của tool bằng Zod, sau đó chỉ định component React sẽ được vẽ ra khi tool kết thúc:
    ```typescript
    useRenderTool({
      name: "create_job",
      parameters: z.object({ ... }),
      render: ({ status, result }) => {
        if (status === "complete") return <CreateJobResultCard data={result} />;
      }
    });
    ```

### 3.4. Human-in-the-Loop (HITL - Con người kiểm soát)
*   **Khái niệm:** Một mẫu thiết kế trong AI Agent: đối với các tác vụ quan trọng (gửi email, thanh toán, xóa dữ liệu), hệ thống bắt buộc phải dừng lại chờ sự phê duyệt trực tiếp từ con người trước khi thực thi mã nguồn.
*   **Ứng dụng trong dự án:** Hook `useHumanInTheLoop` ([job-tools-renderer.tsx:L254](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/components/ai/renderers/job-tools-renderer.tsx#L254)) đăng ký tool `send_email` hoàn toàn ở frontend. Khi LLM quyết định gửi mail cho ứng viên, UI chat sẽ chặn lại, hiển thị nội dung email trong một Iframe kèm nút bấm "Xác nhận gửi" và "Hủy". Gmail API thật chỉ được gọi từ trình duyệt sau khi người dùng bấm xác nhận.

---

## 4. XỬ LÝ PHIÊN & BẢO MẬT HỆ THỐNG (BFF Proxy & Session Security)

### 4.1. BFF Proxy (Backend-for-Frontend Proxy)
*   **Khái niệm:** Là lớp trung gian giải quyết bài toán phân quyền. Trình duyệt không gọi trực tiếp API của NestJS Backend hay FastAPI Agent mà đi qua proxy của Next.js ([route.ts](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/app/api/agent/[...slug]/route.ts)).
*   **Vai trò:** Kiểm tra cookie trình duyệt của người dùng có thực sự hợp lệ không (bằng cách gọi `/auth/me` của NestJS) trước khi chuyển tiếp yêu cầu đến Agent Server, bảo đảm an toàn hệ thống.

### 4.2. Cookie / Session Propagation (Chuyển tiếp phiên đăng nhập)
*   **Khái niệm:** Cách thức chuyển tiếp thông tin đăng nhập của người dùng qua các tầng dịch vụ chạy ở các ngôn ngữ khác nhau (Next.js $\rightarrow$ Python FastAPI $\rightarrow$ NestJS).
*   **Cách thức hoạt động trong dự án:**
    1.  Next.js API Gateway bóc cookie từ request của trình duyệt và đóng gói vào body gửi đến Agent FastAPI ([route.ts:L75](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src/app/api/copilotkit/[[...slug]]/route.ts#L75)).
    2.  `auth_node` của Agent lưu cookie này vào trạng thái đồ thị (`state["authorization"]`) ([base_agent.py:L172](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/agents/base_agent.py#L172)).
    3.  `ApiClient` của Agent đính kèm cookie này vào header `Cookie` của mọi request HTTP gửi đi NestJS Backend ([api_client.py:L60](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/core/api_client.py#L60)).

### 4.3. Race Condition & Shared API Client (Xử lý đa người dùng trên Agent Server)
*   **Khái niệm:** Khi server FastAPI chạy, chỉ có một thực thể `ApiClient` duy nhất được tạo ra để dùng chung cho mọi luồng request (shared instance). Nếu User A và User B chat đồng thời, việc ghi đè cookie trực tiếp lên instance này có thể gây rò rỉ quyền hạn (race condition).
*   **Giải pháp:** Trong các Node thực thi Tool (hàm đồng bộ, chạy trên luồng đơn của request đó), hệ thống gọi hàm `sync_auth_from_state` để cập nhật cookie từ State của chính request đó lên `ApiClient` ngay trước khi thực hiện cuộc gọi API HTTP kế tiếp ([base_tool.py:L26](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/base_tool.py#L26)), đảm bảo tính cô lập và an toàn tuyệt đối.

---

## 5. TÌM KIẾM NGỮ NGHĨA & BỘ LỌC HAI LỚP (Semantic Search, pgvector & Hybrid Search)

### 5.1. Vector Embedding (Nhúng từ khóa ngữ nghĩa)
*   **Khái niệm:** Chuyển đổi một câu ngôn ngữ tự nhiên thành một chuỗi các số thực đại diện cho tọa độ của nó trong không gian vector đa chiều (nơi các từ có nghĩa gần nhau sẽ nằm cạnh nhau).
*   **Ứng dụng trong dự án:** Khi tìm kiếm việc làm, từ khóa của người dùng được gửi tới dịch vụ **Ollama** tại local chạy model `nomic-embed-text` để tạo vector nhúng ([search_jobs.py:L198](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/search_jobs.py#L198)).

### 5.2. pgvector (Cơ sở dữ liệu quan hệ hỗ trợ Vector)
*   **Khái niệm:** Extension của PostgreSQL giúp lưu trữ các mảng vector và tính toán khoảng cách cosine giữa các vector một cách nhanh chóng.
*   **Ứng dụng trong dự án:** Khi Agent gọi API tìm việc bằng vector, backend NestJS thực hiện truy vấn cơ sở dữ liệu tính khoảng cách cosine similarity nhằm trả về các job có mức độ tương thích thô cao nhất.

### 5.3. Hybrid Search & Multi-Stage Filtering (Bộ lọc đa tầng)
*   **Khái niệm:** Kết hợp tìm kiếm vector tốc độ cao và khả năng đọc hiểu ngữ cảnh sâu của LLM.
    *   *Tầng 1 (Lọc thô):* Database PostgreSQL (pgvector) trả về danh sách công việc có cosine similarity $\ge 0.35$.
    *   *Tầng 2 (Lọc tinh):* Đưa danh sách rút gọn sang một LLM phụ (`_filter_llm` chạy ở `temperature=0`) để đọc hiểu nghiệp vụ thật sự (phân biệt chuyên môn chi tiết, loại bỏ các job gần âm hoặc không tương thích ngành nghề thực tế) ([search_jobs.py:L143](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/search_jobs.py#L143)). Kỹ thuật này giúp đạt độ chính xác gần như tuyệt đối (100%).

### 5.4. LangChain Callbacks Isolation (Cô lập cuộc gọi AI nội bộ)
*   **Khái niệm:** Tránh việc hệ thống tự động theo dõi (trace) và stream toàn bộ nội dung tính toán thô của các LLM phụ trợ (như LLM chấm điểm, LLM lọc trùng) lên UI chat của người dùng.
*   **Giải pháp:** Khi gọi LLM phụ trợ, cấu hình tham số `config={"callbacks": [], "run_name": "..."}` để ngắt kế thừa các callback từ đồ thị chính, cô lập hoàn toàn cuộc gọi khỏi luồng stream của CopilotKit ([search_jobs.py:L169](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/search_jobs.py#L169)).

---

## 6. MODEL CONTEXT PROTOCOL (MCP - Giao thức mở rộng AI)

### 6.1. Model Context Protocol (MCP) là gì?
*   **Khái niệm:** Là một giao thức chuẩn hóa do Anthropic phát triển, cho phép LLM kết nối an toàn với các nguồn dữ liệu và công cụ bên ngoài thông qua một giao diện thống nhất.
*   **Ứng dụng trong dự án:** Khi Candidate Agent cần thiết kế mẫu CV, nó kết nối trực tiếp đến một MCP server thiết kế CV riêng thông qua client `MultiServerMCPClient` chạy trên giao thức truyền SSE (Server-Sent Events) ([cv_template.py:L89](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/cv_template.py#L89)).

### 6.2. Dynamic Tool Ingestion (Nạp công cụ động)
*   **Khái niệm:** Agent không cần khai báo cứng toàn bộ mã nguồn của các tool trong server FastAPI. Nó có thể kết nối với MCP server để tự động tải về danh sách các tool khả dụng tại thời điểm chạy (`await mcp_client.get_tools()`) và gắn chúng trực tiếp vào Agent con xử lý ([cv_template.py:L90](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent/tools/candidate/cv_template.py#L90)).
*   **Vai trò:** Giúp kiến trúc của dự án cực kỳ mô-đun hóa, tách biệt logic nghiệp vụ thiết kế mẫu CV phức tạp (nằm ở MCP Server) ra khỏi Agent chính (nằm ở FastAPI).h hiển thị UI Card cho một tool cụ thể khi tool đó thực thi hoàn tất. (VD: Đăng ký tool `search_jobs` để render giao diện danh sách công việc `JobListCard`).

### 3.4. copilotkit_emit_state
Hàm gửi tín hiệu trạng thái thời gian thực (real-time streaming) từ backend Python về frontend trình duyệt để cập nhật tiến trình (VD: hiển thị tiến độ 50%, đang chạy tác vụ gì) trong lúc tool backend đang xử lý nặng.

---

## 4. KHÁI NIỆM VỀ VECTOR SEARCH (Tìm kiếm Ngữ nghĩa)

Để tìm kiếm công việc thông minh, hệ thống sử dụng tìm kiếm vector thay vì tìm kiếm từ khóa thô (lexical search).

### 4.1. Vector Embedding (Nhúng Vector)
Là quá trình chuyển đổi một câu văn bản tự nhiên (VD: *"Lập trình viên NodeJS lương cao"*) thành một mảng các số thực (thường có độ dài 768 hoặc 1536 chiều) đại diện cho ý nghĩa ngữ nghĩa của câu đó. Dự án sử dụng model `nomic-embed-text` chạy cục bộ thông qua **Ollama**.

### 4.2. pgvector (Cơ sở dữ liệu Vector)
Là một tiện ích mở rộng (extension) cho PostgreSQL, cho phép lưu trữ trực tiếp các mảng số thực này vào cột dữ liệu và thực hiện tính toán độ tương đồng (Cosine Similarity hoặc L2 Distance) để tìm kiếm các công việc có ngữ nghĩa gần nhất với câu hỏi của ứng viên.
