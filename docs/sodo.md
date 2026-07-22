# SƠ ĐỒ HOẠT ĐỘNG VÀ VẬN HÀNH CỦA AI AGENT

Tài liệu này mô phỏng luồng xử lý chi tiết từ thời điểm người dùng gửi tin nhắn trên trình duyệt cho tới khi hệ thống AI Agent phân tích ngữ cảnh, gọi các công cụ (tools) kết nối với Backend, cơ sở dữ liệu và hiển thị kết quả trực quan đến người dùng cuối.

---

## 1. Sơ đồ hoạt động (Mermaid Diagram)

```mermaid
graph TD
    %% Định nghĩa Style màu sắc
    classDef fe fill:#e0f7fa,stroke:#006064,stroke-width:2px;
    classDef bff fill:#e8eaf6,stroke:#1a237e,stroke-width:2px;
    classDef agent fill:#efebe9,stroke:#3e2723,stroke-width:2px;
    classDef ext fill:#efebe9,stroke:#1b5e20,stroke-width:2px;

    %% Định nghĩa các Subgraph đại diện các vùng hệ thống
    subgraph Frontend ["Web Client (Trình duyệt)"]
        UI["Khung Chat / Widget UI"]
        CPK["CopilotKit React SDK"]
        RDR["Custom UI Cards (useRenderTool)"]
    end
    class Frontend,UI,CPK,RDR fe;

    subgraph BFF ["BFF (Next.js API Gateway)"]
        API_Route["Route: /api/copilotkit/[[...slug]]"]
        Runtime["CopilotRuntime"]
    end
    class BFF,API_Route,Runtime bff;

    subgraph AgentServer ["FastAPI Agent Service (Python)"]
        LG["Đồ thị LangGraph"]
        Auth["auth_node (Gán thông tin xác thực)"]
        Chat["chat_node (LLM GPT-4o-mini)"]
        Router{"should_continue (Định tuyến)"}
        CustomNodes["Custom Tool Nodes (Tìm việc, lưu CV,...)"]
        StdToolNode["Standard Tool Node (Duyệt ứng viên,...)"]
        APIClient["ApiClient (Giao tiếp HTTP)"]
    end
    class AgentServer,LG,Auth,Chat,Router,CustomNodes,StdToolNode,APIClient agent;

    subgraph ExtServices ["Hạ tầng & Dịch vụ ngoài"]
        Backend["NestJS Backend (API v1)"]
        Ollama["Ollama (Sinh Vector Embedding)"]
        DB[("Database PostgreSQL (pgvector)")]
    end
    class ExtServices,Backend,Ollama,DB ext;

    %% Luồng liên kết các bước
    UI -->|1. Nhập câu hỏi/yêu cầu| CPK
    CPK -->|2. Gửi HTTP Request kèm context| API_Route
    API_Route --> Runtime
    Runtime -->|3. Chuyển tiếp (Proxy) State| LG

    LG --> Auth
    Auth -->|4. Lưu Cookie/JWT & gán user_id vào State| Chat
    Chat -->|5. Gọi LLM kèm Bind Tools| Router

    Router -->|6a. Trả về text chat thông thường| CPK
    Router -->|6b. Yêu cầu chạy Frontend Tool| CPK
    Router -->|6c. Gọi Tool của Candidate| CustomNodes
    Router -->|6d. Gọi Tool của Recruiter| StdToolNode

    CustomNodes -->|7a. Phát trạng thái/tiến độ thời gian thực| CPK
    CustomNodes -->|7b. Request API| APIClient
    StdToolNode -->|7c. Request API| APIClient

    APIClient -->|8. Gọi endpoints bảo mật| Backend
    CustomNodes -.->|9. Lấy vector keyword| Ollama
    Ollama -.->|Tìm vector tương đồng| DB
    Backend -.->|Truy vấn dữ liệu| DB

    APIClient -->|10. Trả kết quả JSON| CustomNodes
    APIClient -->|10. Trả kết quả JSON| StdToolNode

    CustomNodes -->|11. Đóng gói ToolMessage| Chat
    StdToolNode -->|11. Đóng gói ToolMessage| Chat

    CPK -->|12. Trực quan hóa dữ liệu| RDR
    RDR -->|Hiển thị Card đẹp mắt| UI
```

---

## 2. Giải thích chi tiết các thành phần trong sơ đồ

### A. Vùng Web Client (Frontend)
Nơi tiếp nhận trực tiếp hành động từ người dùng và phản hồi kết quả trực quan.
* **Khung Chat / Widget UI:** Khung hội thoại AI được tích hợp tại màn hình ứng viên hoặc nhà tuyển dụng.
* **CopilotKit React SDK:** Thư viện chịu trách nhiệm bắt giữ ngữ cảnh trang web hiện tại (User đang xem trang nào, ID là gì) rồi tự động đồng bộ hóa trạng thái hai chiều giữa Client và Server.
* **Custom UI Cards (useRenderTool):** Component tùy biến giao diện. Khi các công cụ chạy hoàn thành và trả về dữ liệu cấu trúc (JSON), thay vì in ra text thô thì hệ thống sử dụng các card như `JobListCard` hay `SaveCvResultCard` để dựng giao diện đẹp mắt.

### B. Vùng BFF (Next.js API Gateway)
Đóng vai trò là cổng trung gian (Backend-for-Frontend) tiếp nhận và định tuyến dữ liệu.
* **API Route (`/api/copilotkit/[[...slug]]`):** Lắng nghe các sự kiện đồng bộ trạng thái chat từ frontend.
* **CopilotRuntime:** Định tuyến yêu cầu đến đúng máy chủ dịch vụ của Agent Python đang chạy ở cổng `8125` (phân chia cụ thể luồng `/candidate` hoặc `/recruiter`).

### C. Vùng Agent Service (Python LangGraph)
Trí não chính của hệ thống, điều khiển luồng hoạt động bằng đồ thị dạng StateGraph.
* **auth_node:** Lấy token xác thực (JWT/Cookie) được đẩy từ frontend, phân tích quyền truy cập, thiết lập cấu hình kết nối bảo mật cho API Client, đồng thời cập nhật metadata của User hiện tại vào trạng thái của đồ thị.
* **chat_node:** Nạp prompts cấu hình và gọi mô hình ngôn ngữ lớn (LLM OpenAI) xử lý lịch sử tin nhắn cùng ngữ cảnh.
* **should_continue (Router):** Bộ định tuyến kiểm tra xem câu trả lời của LLM có yêu cầu gọi công cụ (tool calls) nào không. Nếu có, nó sẽ chuyển tiếp luồng tới nút thực thi tương ứng. Nếu không, nó sẽ kết thúc luồng hoạt động và trả kết quả văn bản chat cho người dùng.
* **Custom Tool Nodes & Std Tool Node:** Tập hợp các hàm xử lý logic nghiệp vụ cho từng công cụ cụ thể (như tìm kiếm việc làm, lưu trữ CV, xếp hạng ứng viên, soạn email...).
* **ApiClient:** Trình gọi HTTP Client không đồng bộ (dựa trên thư viện `httpx`), hỗ trợ gửi/nhận yêu cầu tới backend NestJS một cách an toàn.

### D. Vùng Hạ tầng & Dịch vụ ngoài (External Services)
* **NestJS Backend:** Máy chủ chứa dữ liệu nghiệp vụ chính của dự án. Tiếp nhận các request an toàn từ `ApiClient` để ghi nhận dữ liệu vào DB thông qua Prisma.
* **Ollama Service:** Dịch vụ chạy model học máy offline ở local (`nomic-embed-text`) dùng để sinh ra các vector nhúng (vector embeddings) từ câu truy vấn tìm việc của ứng viên.
* **Database PostgreSQL:** Nơi lưu trữ thông tin thực tế của dự án. Hỗ trợ tìm kiếm theo vector ngữ nghĩa thông qua extension `pgvector` phục vụ việc so khớp công việc thông minh.

---

## 3. Quy trình vận hành qua 12 bước chi tiết

1. **Bước 1:** Người dùng nhập tin nhắn yêu cầu hỗ trợ (VD: *"Lưu thông tin CV này cho tôi"*).
2. **Bước 2:** CopilotKit Client đóng gói tin nhắn kèm trạng thái context của người dùng gửi lên Next.js API Gateway.
3. **Bước 3:** Next.js `CopilotRuntime` thực hiện proxy dữ liệu này sang dịch vụ LangGraph Python.
4. **Bước 4:** Tại `auth_node`, hệ thống đọc cookie/token xác định người dùng đang đăng nhập và truyền token đó vào tiêu đề Authorization của `ApiClient`.
5. **Bước 5:** Tại `chat_node`, LangGraph kết hợp prompt hệ thống, lịch sử chat và gọi LLM OpenAI để quyết định xem hành động tiếp theo cần gọi tool nào (VD: chọn tool `save_cv`).
6. **Bước 6:** Bộ định tuyến `should_continue` kiểm tra yêu cầu gọi tool và chuyển tiếp luồng tới đúng Node thực thi của công cụ đó.
7. **Bước 7:**
   * **7a:** Tool bắt đầu chạy và liên tục phát thông tin cập nhật tiến độ (VD: *"Đang lưu CV mới..."* kèm tiến độ 80%) qua SSE về Frontend để hiển thị trạng thái xử lý cho người dùng.
   * **7b / 7c:** Tool kích hoạt hàm `ApiClient` để gửi dữ liệu xử lý đến Backend.
8. **Bước 8:** `ApiClient` gửi yêu cầu API bảo mật (kèm Authorization token đã thiết lập ở bước 4) đến NestJS Backend.
9. **Bước 9:** *(Riêng với tool tìm việc)*: Agent sẽ gửi từ khóa tới Ollama để lấy vector biểu diễn ngữ nghĩa, sau đó thực hiện truy vấn cosine-similarity tìm các công việc phù hợp nhất trong PostgreSQL DB.
10. **Bước 10:** Backend NestJS thực thi nghiệp vụ (lưu DB, đổi trạng thái ứng tuyển...) và trả dữ liệu JSON thành công/thất bại về cho Agent.
11. **Bước 11:** Tool Node chuyển dữ liệu thô nhận được từ backend thành một `ToolMessage` và đưa lại cho LLM tại `chat_node`. LLM đọc hiểu kết quả này và tổng hợp thành câu phản hồi tự nhiên cho người dùng.
12. **Bước 12:** Dữ liệu hoàn chỉnh được gửi ngược lại về Web Client. Frontend kiểm tra tên tool vừa chạy, kích hoạt bộ render `useRenderTool` tương ứng để vẽ thẻ UI đẹp mắt (như hiển thị thẻ báo lưu CV thành công) lên màn hình chat của người dùng.
