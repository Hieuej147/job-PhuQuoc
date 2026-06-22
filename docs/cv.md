# Tài liệu cập nhật tính năng CV - PQJobs

Tài liệu này ghi nhận các thay đổi kỹ thuật để hỗ trợ tạo, chỉnh sửa trực quan và lưu trữ độc lập thông tin liên hệ (Họ tên, Ảnh đại diện, Điện thoại, Email) cho từng bản CV (không bị ghi đè và lưu chung giữa các CV của cùng một tài khoản).

---

## 1. Cập nhật Cơ sở Dữ liệu (Prisma Schema)

Bổ sung các trường thông tin liên hệ trực tiếp vào bảng `CandidateResume` (`candidate_resume`) để lưu riêng biệt cho mỗi CV:

File: [backend/prisma/schema.prisma](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/backend/prisma/schema.prisma)
```prisma
model CandidateResume {
  id          String   @id @default(cuid())
  userId      String
  title       String   @default("Hồ sơ của tôi")
  address     String?
  summary     String?
  socialLinks Json?
  education   Json?
  experience  Json?
  projects    Json?
  skills      String?
  degree      String?
  languages   String?
  
  // Bổ sung các trường lưu độc lập cho từng CV
  name        String?
  email       String?
  phone       String?
  avatar      String?

  isDefault   Boolean  @default(false)
  templateId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         user           @relation(fields: [userId], references: [id], onDelete: Cascade)
  template     ResumeTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  applications JobApplication[]

  @@index([userId])
  @@map("candidate_resume")
}
```

---

## 2. Cập nhật Backend (NestJS)

### DTO validation:
Bổ sung khai báo các trường `name`, `email`, `phone`, `avatar` vào `CreateResumeDto` và `UpdateResumeDto` để bộ lọc NestJS chấp nhận dữ liệu gửi lên.
* File: [resume.dto.ts](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/backend/src/modules/resumes/dto/resume.dto.ts)

### Service query:
Cập nhật hàm `findById` trong `resumes.service.ts` để luôn tải kèm thông tin `user` liên kết làm dữ liệu mặc định.
* File: [resumes.service.ts](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/backend/src/modules/resumes/resumes.service.ts)

---

## 3. Cập nhật Frontend (Next.js)

### Nạp dữ liệu CV ưu tiên độc lập:
* Cập nhật cả trang xem chi tiết và trang chỉnh sửa để lấy dữ liệu liên hệ từ bản ghi CV trước, nếu không có mới lấy thông tin mặc định từ tài khoản người dùng (`r.user`).
* File cấu hình chỉnh sửa: [edit/page.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/candidate/resumes/[id]/edit/page.tsx)
* File cấu hình hiển thị: [page.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/candidate/resumes/[id]/page.tsx)

### Độc lập hoá nút "Lưu thay đổi" & "Đổi ảnh":
* Toàn bộ 6 mẫu CV thiết kế (Classic, Modern, Creative, Elegant, Futuristic, Minimalist Modern) trong [web/src/template](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/template) đã được điều chỉnh:
  1. Không gọi `PATCH /api/v1/auth/me` để tránh ghi đè thông tin tài khoản dùng chung.
  2. Gửi thẳng `name`, `email`, `phone`, `avatar` trực tiếp vào payload lưu trữ của CV đó qua API. Nếu là CV mới (chưa có `resumeId`), gửi yêu cầu `POST /api/v1/resumes`, ngược lại gửi `PATCH /api/v1/resumes/${resumeId}`.
  3. Xử lý tải ảnh đại diện bằng `FileReader` chuyển sang dạng Base64 Data URL, lưu trữ an toàn trong DB thay vì URL tạm thời (`blob:`).
  4. Tự động chuyển hướng về trang danh sách CV `/candidate/resumes` ngay khi lưu thành công.

### Quy trình tạo CV mới (Chỉ lưu khi bấm nút Lưu):
* Khi chọn mẫu CV ở trang `templates/page.tsx`, người dùng được chuyển hướng trực tiếp đến `/candidate/resumes/new?templateId=tpl-...` thay vì gửi API POST tạo nháp trước.
* Trang `/candidate/resumes/new` sẽ kết xuất mẫu CV trực tiếp trên client với thông tin mặc định tải từ trang cá nhân của tài khoản (`/api/v1/auth/me`). Khi người dùng bấm **Lưu thay đổi** lần đầu tiên, CV mới được chính thức tạo và lưu vào CSDL.

### Sửa lỗi không xóa được CV:
* Cập nhật API Proxy Route [route.ts](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/api/v1/[...slug]/route.ts) để tránh gọi hàm `request.text()` cho phương thức `DELETE`. Việc gọi `request.text()` trên các yêu cầu `DELETE` không chứa body (thân tin nhắn) đã gây treo proxy, dẫn đến không xóa được CV từ trang chi tiết.

---

## 4. Quy trình Ứng tuyển & Rút đơn ứng tuyển (Candidate & Employer)

Dưới đây mô tả chi tiết luồng xử lý và dữ liệu trao đổi giữa ứng viên (Candidate) và nhà tuyển dụng (Employer) khi nộp hồ sơ hoặc rút hồ sơ ứng tuyển:

### 4.1. Chi tiết luồng xử lý

* **Ứng tuyển (Apply Flow):**
  1. Candidate truy cập trang chi tiết công việc, chọn **Ứng tuyển ngay**.
  2. Lựa chọn CV có sẵn hoặc upload PDF, điền thư giới thiệu (tùy chọn).
  3. Gửi đơn ứng tuyển: FE gọi `POST /api/v1/applications`.
  4. BE kiểm tra tính hợp lệ của công việc, xác thực vai trò ứng viên, kiểm tra trùng lặp (chỉ được nộp 1 lần/công việc).
  5. BE lưu bản ghi ứng tuyển vào bảng `JobApplication` trong Database với trạng thái mặc định là `PENDING` (Chờ xem).

* **Xem & Xét duyệt (Employer Management):**
  1. Employer truy cập trang **Hồ sơ ứng viên** (`/employer/applications`).
  2. FE gọi `GET /api/v1/applications/employer` để lấy danh sách hồ sơ ứng tuyển liên kết với công ty.
  3. Employer có thể xem CV chi tiết (PDF/Web preview), đánh dấu bookmark, hoặc xét duyệt trạng thái ứng viên (Duyệt/Từ chối): FE gọi `PATCH /api/v1/applications/:id/status` lưu thẳng vào Database.

* **Rút đơn ứng tuyển (Withdraw Flow):**
  1. Khi đã ứng tuyển, trang chi tiết công việc hiển thị trạng thái **Đã ứng tuyển** cùng nút đỏ **Bỏ ứng tuyển**.
  2. Bấm **Bỏ ứng tuyển**: FE hiển thị một **Modal xác nhận rút hồ sơ (Custom Modal)** tuyệt đẹp để xác nhận lại ý định của người dùng.
  3. Xác nhận đồng ý: FE gọi `DELETE /api/v1/applications/:id`.
  4. BE kiểm tra quyền sở hữu đơn nộp và xóa hoàn toàn dòng dữ liệu `JobApplication` ra khỏi CSDL PostgreSQL.
  5. UI của Candidate lập tức cập nhật trạng thái về **Ứng tuyển ngay**.
  6. Giao diện của Employer sẽ không còn hiển thị hồ sơ ứng viên này nữa sau khi **Làm mới trang (F5)** (do bản ghi đã bị xóa vĩnh viễn khỏi Database).

### 4.2. Sơ đồ tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as 🙋‍♂️ Candidate
    participant FE as 🖥️ Frontend (Next.js)
    participant BE as ⚙️ Backend (NestJS)
    participant DB as 🗄️ Database (PostgreSQL)
    actor Employer as 🏢 Employer
    
    %% Apply Flow
    rect rgb(220, 245, 230)
        Note over Candidate, DB: Quy trình Ứng tuyển (Apply Flow)
        Candidate->>FE: Bấm "Ứng tuyển" & Chọn CV (hoặc tải PDF)
        FE->>BE: POST /api/v1/applications { jobId, resumeId/cvUrl, coverLetter }
        BE->>DB: Kiểm tra job, kiểm tra trùng lặp
        DB-->>BE: Xác nhận hợp lệ
        BE->>DB: Tạo bản ghi JobApplication (status: PENDING)
        DB-->>BE: Lưu thành công
        BE-->>FE: Trả về thông tin Application thành công
        FE-->>Candidate: Hiển thị trạng thái "Đã ứng tuyển" & Toast thành công
    end

    %% Employer View
    rect rgb(230, 240, 255)
        Note over Employer, DB: Quy trình Xem & Xét duyệt (Employer Management)
        Employer->>FE: Truy cập trang quản lý ứng viên (/employer/applications)
        FE->>BE: GET /api/v1/applications/employer
        BE->>DB: Lấy danh sách JobApplication của công ty
        DB-->>BE: Trả về danh sách
        BE-->>FE: Trả về JSON danh sách ứng tuyển
        FE-->>Employer: Hiển thị thẻ thông tin ứng viên
        Employer->>FE: Bấm duyệt hồ sơ ("Chấp nhận" / "Từ chối")
        FE->>BE: PATCH /api/v1/applications/:id/status { status }
        BE->>DB: Cập nhật status trong JobApplication
        DB-->>BE: Lưu thành công
        BE-->>FE: Phản hồi thành công
        FE-->>Employer: Cập nhật UI trạng thái mới
    end

    %% Withdraw Flow
    rect rgb(255, 230, 230)
        Note over Candidate, DB: Quy trình Rút đơn (Withdraw Flow)
        Candidate->>FE: Bấm "Bỏ ứng tuyển" (Từ trang Chi tiết công việc)
        FE-->>Candidate: Hiển thị Modal Custom xác nhận rút đơn
        Candidate->>FE: Xác nhận "Rút ứng tuyển" (Đồng ý)
        FE->>BE: DELETE /api/v1/applications/:id
        BE->>DB: Xóa bản ghi JobApplication khỏi DB
        DB-->>BE: Xóa thành công
        BE-->>FE: Trả về thông báo thành công
        FE-->>Candidate: Cập nhật UI thành "Ứng tuyển ngay" & Ẩn nút "Bỏ ứng tuyển"
        Note over Employer: Sau khi F5 trang, hồ sơ rút ứng tuyển biến mất
    end
```
    end
```

---

## 5. Quy trình Khởi tạo & Tạo mới CV (Create CV Flow)

Dưới đây mô tả chi tiết luồng xử lý và dữ liệu trao đổi khi ứng viên (Candidate) bắt đầu tạo một CV mới từ kho mẫu thiết kế cho đến khi lưu trữ thành công vào Cơ sở dữ liệu:

### 5.1. Chi tiết luồng xử lý

* **Bước 1: Lựa chọn Mẫu CV (Template Selection)**
  * Người dùng truy cập trang danh sách Template CV tại đường dẫn `/candidate/resumes/templates` (file [templates/page.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/candidate/resumes/templates/page.tsx)).
  * Khi chọn mẫu mong muốn, hệ thống sẽ chuyển hướng người dùng sang trang tạo mới kèm tham số ID của mẫu: `/candidate/resumes/new?templateId=tpl-...`.

* **Bước 2: Tải thông tin tài khoản & Khởi tạo dữ liệu mẫu (Pre-fill Profile & Client Init)**
  * Trang `/candidate/resumes/new` (file [new/page.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/candidate/resumes/new/page.tsx)) khi được tải sẽ tự động thực hiện:
    1. Gọi API `GET /api/v1/auth/me` để lấy thông tin cá nhân hiện tại của tài khoản (Họ tên, email, điện thoại, avatar mặc định).
    2. Khởi tạo một đối tượng dữ liệu CV mẫu (`defaultResume`) chứa các thông tin học vấn, kinh nghiệm và dự án cơ bản để hiển thị trực quan.
    3. Kết xuất (Render) component template tương ứng (ví dụ: [TemplateClassic.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/template/TemplateClassic.tsx)). *Lưu ý: Lúc này chưa có bản ghi nào được lưu trữ xuống Database.*

* **Bước 3: Chỉnh sửa trực quan trên Client (Visual Editing)**
  * Ứng viên thực hiện chỉnh sửa trực tiếp dữ liệu cá nhân, thông tin liên hệ, học vấn, kinh nghiệm trên giao diện trực quan.
  * Nếu đổi ảnh đại diện, file ảnh được đọc thông qua `FileReader` để chuyển sang dạng **Base64 Data URL** lưu trữ trực tiếp vào trường `avatar` của bảng ghi CV (không lưu chung và ghi đè ảnh tài khoản chính).

* **Bước 4: Gửi yêu cầu Tạo mới CV (Create Request)**
  * Khi người dùng nhấn nút **Lưu thay đổi**, hệ thống kiểm tra sự tồn tại của `resumeId`. Vì đây là lần đầu tạo mới (`resumeId` chưa tồn tại), Front-end sẽ gửi một request `POST /api/v1/resumes` (file template xử lý lưu dữ liệu).
  * Payload truyền đi bao gồm toàn bộ thông tin CV độc lập cùng `templateId` tương ứng.

* **Bước 5: Xử lý ở Backend & Lưu Cơ sở Dữ liệu (Backend Storage)**
  * NestJS Controller (file [resumes.controller.ts](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/backend/src/modules/resumes/resumes.controller.ts)) nhận request `POST /`.
  * Service (file [resumes.service.ts](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/backend/src/modules/resumes/resumes.service.ts)) thực hiện:
    1. Xác thực và kiểm tra sự tồn tại của `templateId`.
    2. Nếu người dùng chọn đây là CV mặc định (`isDefault = true`), tự động chuyển đổi toàn bộ các CV khác của người dùng đó thành `isDefault = false` (`updateMany`).
    3. Tạo một dòng dữ liệu mới trong bảng `CandidateResume` (`candidate_resume`) thông qua Prisma.
  * Backend phản hồi kết quả thành công HTTP 201 cùng dữ liệu bản ghi mới bao gồm cả `id` được tạo tự động.

* **Bước 6: Hoàn tất & Chuyển hướng (Done & Redirect)**
  * Front-end nhận response thành công, ghi nhận `resumeId` mới, hiển thị toast thông báo thành công và chuyển hướng người dùng về trang danh sách CV cá nhân: `/candidate/resumes`.

### 5.2. Sơ đồ tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as 🙋‍♂️ Candidate
    participant FE as 🖥️ Frontend (Next.js)
    participant BE as ⚙️ Backend (NestJS)
    participant DB as 🗄️ Database (PostgreSQL)
    
    Note over Candidate, DB: Quy trình Khởi tạo & Tạo mới CV (Create CV Flow)
    
    Candidate->>FE: Bấm chọn mẫu CV tại trang /candidate/resumes/templates
    FE->>Candidate: Chuyển hướng sang trang /candidate/resumes/new?templateId=tpl-...
    
    rect rgb(240, 248, 255)
        Note over FE, BE: Tải thông tin tài khoản ban đầu
        FE->>BE: GET /api/v1/auth/me
        BE-->>FE: Trả về thông tin User (name, email, phone, image)
    end
    
    FE-->>Candidate: Hiển thị CV Editor với thông tin mặc định (Chưa lưu DB)
    
    rect rgb(255, 253, 230)
        Note over Candidate, FE: Chỉnh sửa trực quan trên giao diện
        Candidate->>FE: Chỉnh sửa thông tin CV (Tên, Ảnh, Học vấn, Kinh nghiệm...)
        Note over Candidate, FE: Ảnh đại diện tải lên được đọc thành Base64 Data URL
    end
    
    Candidate->>FE: Bấm nút "Lưu thay đổi" (Lần đầu tạo)
    FE->>BE: POST /api/v1/resumes { templateId, name, email, phone, avatar, ... }
    
    rect rgb(230, 245, 230)
        Note over BE, DB: Xử lý nghiệp vụ & Lưu DB
        BE->>DB: Kiểm tra Template hợp lệ
        BE->>DB: Cập nhật isDefault = false cho các CV cũ của user (nếu cần)
        BE->>DB: Tạo bản ghi mới trong bảng candidate_resume
        DB-->>BE: Lưu thành công & trả về thông tin CV mới tạo
    end
    
    BE-->>FE: HTTP 201 Created (Trả về data kèm id CV mới)
    FE-->>Candidate: Hiển thị Toast thông báo & Chuyển hướng về /candidate/resumes
```


