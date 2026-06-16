# Đánh giá dự án Job Phú Quốc và Đề xuất cải thiện (Code Review & Architecture Suggestions)

Chào bạn, với tư cách là một Senior Software Engineer, mình đã xem xét qua source code dự án (cả Frontend và Backend) và thiết kế hệ thống của bạn. Dưới đây là những phân tích, phản biện và đề xuất chi tiết để giúp hệ thống chuẩn production, dễ bảo trì và tối ưu hơn.

---

## 1. Vấn đề Frontend: Navbar Dashboard & Dead Code

### **Lỗi Navbar Role-based (Chưa ổn định)**
- **Hiện trạng:** Trong `web/src/components/layout/navbar.tsx`, component nhận prop `role: "candidate" | "employer"`. Tuy nhiên, trong phần Dropdown User và Mobile Menu, các link được **hardcode cứng** trỏ về `/candidate/...` (VD: `/candidate/dashboard`, `/candidate/profile`).
- **Hệ quả:** Khi Employer đăng nhập, họ click vào dropdown sẽ bị điều hướng nhầm sang trang của Candidate, gây lỗi 404 hoặc lỗi không có quyền truy cập, trải nghiệm người dùng (UX) cực kỳ tệ.
- **Đề xuất sửa:** 
  Cần kiểm tra `role` (hoặc lấy từ `user.role` qua Better Auth) để render các menu tương ứng:
  ```tsx
  const menuItems = role === "employer" 
    ? [ { icon: "dashboard", label: "Bảng điều khiển", href: "/employer/dashboard" }, ... ]
    : [ { icon: "dashboard", label: "Dashboard", href: "/candidate/dashboard" }, ... ];
  ```

### **Dead Code & Logic Thừa**
- Việc FE phải gọi API lấy **toàn bộ Categories** chỉ để tìm ra `categoryId` từ `slug` (trong `JobsPageClient` hoặc `page.tsx`) là một dạng logic thừa và tốn resource. Nó nên được xử lý ở phía Backend (chi tiết ở mục 2).

---

## 2. API Public và Lỗi Thiết kế Filter (Slug vs ID)

### **Lỗi dùng Slug làm ID trong Dữ liệu mẫu (Mock data)**
- **Hiện trạng:** Trong DB Schema, `JobCategory.id` được định nghĩa là `@default(cuid())` (sinh mã ngẫu nhiên). Tuy nhiên, như bạn nói, dữ liệu mẫu lại đang gán cứng `id` bằng chính giá trị của `slug`.
- **Phản biện:** Cấu trúc RESTful/Database tiêu chuẩn: Khóa chính (Primary Key - ID) là thứ **không bao giờ được thay đổi** và chỉ dùng cho hệ thống (Internal). Slug là thứ **có thể thay đổi** (SEO purpose, đổi tên category). Nếu gộp ID và Slug làm một, sau này Marketing muốn đổi tên đường dẫn, toàn bộ khóa ngoại (Foreign Key) trong bảng `Job` sẽ bị hỏng.
- **Đề xuất:** Hãy để `id` sinh ra theo đúng chuẩn CUID/UUID.

### **API Public không thân thiện với Production (Lọc bằng ID thay vì Slug)**
- **Hiện trạng:** API `GET /api/v1/jobs` đang yêu cầu truyền `categoryId` hoặc `companyId`. Trong khi đó, URL trên Frontend hiển thị cho người dùng là `?category=nha-hang-khach-san`. FE đang phải dùng 1 thao tác vòng vèo: Lấy `slug` trên URL -> Tìm trong danh sách Categories lấy ra `categoryId` -> Gọi API Filter truyền `categoryId`.
- **Phản biện:** Ở quy mô Production, người dùng và SEO cần URL chứa **Slug**. API public (`GET /jobs`) cũng phải hỗ trợ lọc thẳng bằng `categorySlug`, `companySlug`, `wardSlug`.
- **Đề xuất sửa BE (JobsService & Controller):** 
  Thay vì nhận `categoryId`, thêm Param `categorySlug`. Ở `JobsService`:
  ```typescript
  if (categorySlug) {
    where.category = { slug: { in: categorySlug.split(',') } };
  }
  ```
  Lúc này Frontend KHÔNG cần tải trước danh sách Categories để map ID, giảm thiểu 1 API call thừa, tăng tốc độ render (Core Web Vitals).

### **Lỗ hổng bảo mật DDOS (Thiếu DTO Max Limit)**
- Trong `job.dto.ts` (API `GET /jobs`), param `limit` chỉ được validate `@Min(1)`. Nếu một attacker truyền `limit=1000000`, hệ thống sẽ query và serialize hàng triệu record, gây sập Database ngay lập tức (OOM). 
- **Giải pháp:** Thêm `@Max(100)` vào `JobQueryDto.limit`.

---

## 3. Thiết kế Database & Business Logic cho Backend (NestJS)

### **Vị trí đặt Business Logic (Kiến trúc Modular Monolith)**
- Bạn đang sử dụng kiến trúc Modular Monolith khá tốt khi dùng `CompanyContractService` để gọi chéo module thay vì import trực tiếp (Ví dụ: tạo Job thì gọi `companyContract.findByOwnerId(userId)`). Đây là điểm cộng.
- **Điểm trừ (Logic thừa):** Trong `JobsService.invalidateCache()`, khi thao tác với Job, bạn lại xóa luôn cache của Categories (`this.cache.delPattern('categories:*')`). Việc thêm một Job mới không làm ảnh hưởng đến danh sách Category (danh sách danh mục là tĩnh). Logic này gây lãng phí bộ nhớ cache.

### **Vấn đề Performance với Prisma (JobsService.getFilterStats)**
- **Hiện trạng:** Để đếm (count) số lượng Jobs theo từng mức lương (under_5, 5_10, 10_20, ...), code đang thực hiện **5 câu query `.count()` riêng biệt** nối tiếp nhau bằng `await Promise.all()` hoặc chạy tuần tự.
- **Phản biện:** Với DB hàng trăm ngàn Jobs, 5 lần query bảng Job để đếm sẽ rất chậm. 
- **Đề xuất:** Nên dùng **Raw SQL** với cấu trúc `SUM(CASE WHEN...)` để đếm tất cả trong 1 lần query duy nhất xuống Database.

### **Thiết kế Database (Schema)**
- **Quan hệ `JobApplication`:** Bảng đang có `@@unique([userId, jobId])`. Điều này có nghĩa là 1 user chỉ được apply vào 1 job duy nhất 1 lần trong suốt vòng đời. Nếu công ty từ chối (REJECTED), và vài tháng sau ứng viên muốn nộp lại hồ sơ với CV xịn hơn, hệ thống sẽ báo lỗi. Bạn nên cân nhắc có nên giữ Unique Constraint này không, hoặc chuyển nó thành Business Logic ở Service (chỉ chặn nếu Status đang là PENDING hoặc REVIEWING).
- **Trạng thái Job (Job Status Flow):** Logic của `VALID_STATUS_TRANSITIONS` trong service chặn không cho `CLOSED` -> `ACTIVE` lại. Nếu tin tuyển dụng hết hạn (CLOSED), công ty muốn mở lại (gia hạn), thiết kế hiện tại sẽ bắt họ phải tạo mới hoàn toàn. Nên xem xét thêm flow `CLOSED -> ACTIVE`.

---

## Tóm lại (Checklist Hành Động)

1. **FE:** Sửa ngay file `navbar.tsx`, thêm logic check `role` để hiển thị menu dropdown chính xác cho Employer/Candidate.
2. **BE:** Update DTO API `/jobs` để hỗ trợ filter thẳng bằng `categorySlug` thay vì bắt FE phải truyền ID.
3. **BE:** Chặn ngay tham số `limit` trong các DTO để bảo vệ Database.
4. **Data:** Sửa lại file mock data/seed DB, cho `id` sinh tự động, không map `slug` vào `id` nữa.
5. **BE:** Tối ưu hóa API `/stats` bằng 1 Raw Query duy nhất thay vì 5 lần count.
6. **DB Design:** Cân nhắc bỏ Unique ở `JobApplication` nếu muốn hỗ trợ ứng viên nộp lại CV.

Thiết kế kiến trúc hiện tại của bạn khá bài bản (chia module, inngest, caching, contract). Chỉ cần tinh chỉnh lại các điểm "rìa" giao tiếp giữa FE-BE là dự án sẽ rất hoàn thiện!
