# SƠ ĐỒ HOẠT ĐỘNG CHI TIẾT TỪNG TOOL CỦA AI AGENT

Tài liệu này mô tả chi tiết quy trình xử lý dữ liệu và luồng hoạt động (workflow) của từng công cụ (tool) được xây dựng trong hệ thống Agent.

---

## I. NHÓM 1: CÁC TOOL TÌM KIẾM & TRUY XUẤT DỮ LIỆU (READ-ONLY TOOLS)

### 1. Tool `search_jobs` (Tìm kiếm việc làm ngữ nghĩa)
Tool này sử dụng công nghệ tìm kiếm vector (vector search) để so khớp công việc theo ngữ nghĩa thay vì chỉ tìm từ khóa thô.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Ứng viên
    participant Agent as Candidate Agent (Python)
    participant Ollama as Dịch vụ Ollama
    participant Backend as NestJS API
    participant DB as PostgreSQL (pgvector)

    Candidate->>Agent: Nhập từ khóa (VD: "lập trình React")
    Agent->>Ollama: POST /api/embeddings (Chuyển keyword thành vector nhúng)
    Ollama-->>Agent: Trả về danh sách Vector nhúng [0.15, -0.23, ...]
    Agent->>Backend: POST /jobs/search-vector (Truyền vector và bộ lọc lương/địa điểm)
    Backend->>DB: SELECT * FROM job ORDER BY embedding <=> vector
    DB-->>Backend: Trả về danh sách jobs phù hợp nhất
    Backend-->>Agent: JSON kết quả danh sách jobs
    Agent-->>Candidate: Render dạng danh sách thẻ JobListCard trên trình duyệt
```

---

### 2. Tool `list_my_cvs` (Xem danh sách CV đã lưu)
Truy xuất danh sách tất cả các bản CV mà ứng viên hiện tại đang sở hữu.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Ứng viên
    participant Agent as Candidate Agent
    participant Backend as NestJS API

    Candidate->>Agent: Yêu cầu xem lại các CV đã tạo
    Agent->>Backend: GET /resumes/my (gửi kèm token xác thực)
    Backend-->>Agent: Trả về JSON danh sách CV (id, title, templateId, isDefault)
    Agent-->>Candidate: Render danh sách CV dạng thẻ hàng ngang (CvListCard)
```

---

### 3. Tool `get_cv_detail` (Xem chi tiết một bản CV)
Lấy nội dung chi tiết của một CV cụ thể để đọc hoặc chuẩn bị chỉnh sửa.

```mermaid
graph TD
    A[Bắt đầu] --> B{Đã truyền resume_id?}
    B -- Có --> C[Gửi API: GET /resumes/id]
    B -- Không --> D{Có title_hint?}
    D -- Có --> E[Gọi GET /resumes/my để lấy danh sách CV]
    E --> F{Có CV nào khớp title_hint?}
    F -- Khớp đúng 1 CV --> G[Lấy id của CV đó] --> C
    F -- Khớp nhiều hoặc không khớp --> H[Trả danh sách CV gợi ý để người dùng chọn lại] --> End[Kết thúc]
    D -- Không --> I[Yêu cầu người dùng chỉ định rõ tên CV] --> End
    C --> J[Nhận thông tin học vấn, kinh nghiệm, kỹ năng]
    J --> K[Render thẻ CvDetailCard hiển thị tóm tắt lên trình duyệt] --> End
```

---

### 4. Tool `get_candidates` (Xem hồ sơ ứng viên nộp đơn - Recruiter)
Dành cho nhà tuyển dụng xem danh sách các ứng viên đã nộp đơn vào tin tuyển dụng.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà tuyển dụng
    participant Agent as Recruiter Agent
    participant Backend as NestJS API

    Recruiter->>Agent: Yêu cầu xem ứng viên của Job ID "X"
    Agent->>Backend: GET /applications/job/X (kèm limit, status lọc nếu có)
    Backend-->>Agent: Trả về danh sách ứng viên (tên, email, trạng thái, cover letter)
    Agent-->>Recruiter: AI tóm tắt danh sách ứng viên và gửi dạng tin nhắn văn bản
```

---

### 5. Tool `get_categories` (Lấy danh mục ngành nghề - Recruiter)
Lấy danh sách danh mục để điền đúng thông tin ngành nghề khi tạo tin đăng tuyển mới.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà tuyển dụng
    participant Agent as Recruiter Agent
    participant Backend as NestJS API

    Recruiter->>Agent: Muốn đăng tin tuyển dụng mới
    Agent->>Backend: GET /categories
    Backend-->>Agent: Trả về danh sách ngành nghề (id, name, slug)
    Agent-->>Recruiter: AI liệt kê danh mục ngành nghề và hỏi nhà tuyển dụng lựa chọn
```

---

## II. NHÓM 2: CÁC TOOL TẠO MỚI & CẬP NHẬT DỮ LIỆU (WRITE/UPDATE TOOLS)

### 6. Tool `save_cv` (Tạo mới hoặc chỉnh sửa cập nhật CV)
Quản lý luồng lưu trữ dữ liệu CV của ứng viên.

```mermaid
graph TD
    A[Bắt đầu] --> B{Đã có resume_id?}

    %% Tạo mới CV
    B -- Không (Tạo mới) --> C{Đã chọn template_id?}
    C -- Chưa --> D[Báo lỗi: Yêu cầu chọn template trước]
    C -- Rồi --> E[Đóng gói payload gồm các trường thông tin]
    E --> F[Gửi API: POST /resumes]
    F --> G[Trả về kết quả thành công: ID và tiêu đề CV mới]
    G --> H[Render Card báo tạo CV thành công lên trình duyệt]

    %% Cập nhật CV
    B -- Có (Cập nhật) --> I[Gửi API: GET /resumes/resume_id để lấy dữ liệu cũ]
    I --> J{replace_lists = True?}
    J -- Có --> K[Ghi đè hoàn toàn danh sách học vấn/kinh nghiệm cũ]
    J -- Không --> L[Nối tiếp học vấn/kinh nghiệm mới vào danh sách cũ]
    K & L --> M[Gửi API: PATCH /resumes/resume_id]
    M --> N[Trả về kết quả cập nhật thành công]
    N --> O[Render Card báo cập nhật CV thành công lên trình duyệt]
```

---

### 7. Tool `choose_cv_template` (Lấy và chọn mẫu giao diện CV)
Bắt buộc gọi trước khi tạo mới CV nhằm xác định giao diện hiển thị.

```mermaid
graph TD
    A[Bắt đầu] --> B[Gọi API: GET /resumes/templates]
    B --> C{Lần gọi đầu tiên (Style/Index đều trống)?}

    C -- Đúng --> D[Trả về danh sách mẫu kèm cờ need_user_choice=True]
    D --> E[AI liệt kê danh sách đánh số thứ tự và hỏi ý kiến ứng viên]

    C -- Sai --> F{User chọn theo Số thứ tự index?}
    F -- Đúng --> G[Khớp mẫu theo vị trí trong danh sách]
    F -- Không --> H{User chọn theo tên style?}
    H -- Đúng --> I[So khớp ký tự gần đúng trong tên/mô tả mẫu]
    H -- Không --> J[Nếu user đồng ý cho AI tự chọn -> Lấy mẫu mặc định đầu tiên]

    G & I & J --> K{Khớp thành công?}
    K -- Đúng --> L[Trả về template_id và template_name]
    K -- Không --> D
```

---

### 8. Tool `create_job` (Đăng tin tuyển dụng - Recruiter)
Nhà tuyển dụng thiết lập thông tin và đăng tin tuyển dụng.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà tuyển dụng
    participant Agent as Recruiter Agent
    participant Backend as NestJS API

    Recruiter->>Agent: Xác nhận thông tin tin tuyển dụng (tiêu đề, lương, mô tả...)
    Agent->>Backend: POST /jobs (kèm category_id đã chọn)
    Backend-->>Agent: Trả về JSON thông tin job được tạo (Trạng thái: DRAFT)
    Agent-->>Recruiter: AI thông báo tạo tin thành công và nhắc nhở thanh toán kích hoạt tin đăng
```

---

### 9. Tool `update_application_status` (Duyệt/Từ chối hồ sơ - Recruiter)
Cập nhật trạng thái duyệt đơn ứng tuyển của các ứng viên.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Nhà tuyển dụng
    participant Agent as Recruiter Agent
    participant Backend as NestJS API

    Recruiter->>Agent: Duyệt (hoặc từ chối) hồ sơ ứng viên A
    Agent->>Backend: PATCH /applications/{application_id}/status (status = ACCEPTED/REJECTED)
    Backend-->>Agent: Trả về trạng thái thành công
    Agent-->>Recruiter: AI phản hồi: "Đã cập nhật trạng thái hồ sơ của ứng viên thành công"
```

---

## III. NHÓM 3: CÁC TOOL LOGIC CỤC BỘ (IN-MEMORY TOOLS)

### 10. Tool `draft_email` (Soạn email mẫu gửi ứng viên)
Hỗ trợ soạn thảo nhanh văn bản email theo các sự kiện ứng tuyển.

```mermaid
graph TD
    A[Bắt đầu] --> B[Nhận tham số: email_type interview/rejection/offer/follow_up]
    B --> C{Lọc theo loại email_type}
    C -- interview --> D[Áp dụng template thư mời phỏng vấn]
    C -- rejection --> E[Áp dụng template thư từ chối ứng viên]
    C -- offer --> F[Áp dụng template thư mời nhận việc]
    C -- follow_up --> G[Áp dụng template nhắc nhở ứng tuyển]

    D & E & F & G --> H[Điền tên ứng viên, vị trí tuyển dụng, công ty và thông tin bổ sung]
    H --> I[Đóng gói kết quả gồm Tiêu đề email và Nội dung thư hoàn chỉnh]
    I --> J[AI in nội dung email nháp ra màn hình chat để nhà tuyển dụng copy]
```

---

### 11. Tool `analyze_candidate_dashboard` (Phân tích Dashboard gợi ý hành động)
Phân tích hiện trạng hồ sơ cá nhân của ứng viên để đưa ra lời khuyên tìm việc.

```mermaid
graph TD
    A[Bắt đầu] --> B[Trích xuất dashboard dữ liệu trong context gửi từ Frontend]
    B --> C[Phân tích danh sách checklist kiểm tra hồ sơ]
    C --> D[Kiểm tra danh sách CV hiện có, công việc đã lưu, đơn đã ứng tuyển]

    %% Phân tích các bước
    D --> E{Checklist chưa hoàn thành hoặc chưa có CV?}
    E -- Đúng --> F[Gợi ý: Hoàn thiện thông tin hồ sơ còn thiếu và Tạo CV mới]
    E -- Sai --> G{Đang có công việc đã lưu?}
    G -- Có --> H[Gợi ý: Xem lại các công việc đã lưu để nộp đơn ứng tuyển]
    G -- Không --> I[Gợi ý: Tìm kiếm các công việc phù hợp với kỹ năng]

    F & H & I --> J[Tổng hợp thành 3-5 hành động ưu tiên khuyên làm tiếp theo]
    J --> K[AI diễn đạt thành văn bản tư vấn gửi ứng viên]
```
