# Nhật Ký Thay Đổi Frontend (ngoanfix)

Tài liệu này ghi lại toàn bộ các thay đổi và cải tiến phần giao diện (Frontend) đã được thực hiện trong phiên làm việc này.

---

## 1. Cải Tiến Hiệu Ứng Tải Trang (Skeleton Loading & Suspense)

Để cải thiện trải nghiệm người dùng, tránh hiện tượng màn hình trắng hoặc giật khi tải trang và chuyển đổi bộ lọc:

### A. Trang Danh Sách Công Ty
*   **[NEW]** [loading.tsx (danh sách công ty)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/companies/loading.tsx): Thiết kế giao diện skeleton đồng bộ với cấu trúc của trang thật (thanh tìm kiếm, danh mục ngành nghề, lưới thẻ công ty).
*   **[MODIFY]** [page.tsx (danh sách công ty)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/companies/page.tsx): Bao bọc component render trong thẻ `<Suspense>` để Next.js kích hoạt hiển thị skeleton ngay lập tức khi click chuyển trang.
*   **[MODIFY]** [CompaniesPageClient.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/components/company/CompaniesPageClient.tsx): Sử dụng hook `useTransition` của React để bắt trạng thái tải ngầm khi người dùng bấm chuyển trang, tìm kiếm hoặc chọn danh mục. Hiển thị skeleton ngay tại phần danh sách công ty thay vì giữ nguyên nội dung cũ.

### B. Trang Chi Tiết Công Ty
*   **[NEW]** [loading.tsx (chi tiết công ty)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/companies/[slug]/loading.tsx): Thiết kế giao diện skeleton khớp tỉ lệ 1:1 với trang chi tiết thật (ảnh bìa banner, logo, các thẻ Stats Grid thống kê chỉ số, thanh Tab, và phần thông tin bên dưới) giúp loại bỏ hiện tượng giật lệch bố cục (layout shift).
*   **[MODIFY]** [page.tsx (chi tiết công ty)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/companies/[slug]/page.tsx): Tách riêng luồng gọi dữ liệu. Lấy thông tin cơ bản của công ty trước để render nhanh trang chính, đồng thời truyền danh sách tuyển dụng dưới dạng một `jobsPromise` không await ở server.
*   **[MODIFY]** [CompanyDetailClient.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/companies/[slug]/CompanyDetailClient.tsx): Nhận `jobsPromise` và sử dụng hook `use` kết hợp `<Suspense>` cục bộ để tải riêng danh sách công việc. Nhờ đó, thông tin công ty phía trên hiển thị ngay lập tức, chỉ có danh sách việc làm hiển thị skeleton tải riêng.

### C. Trang Danh Sách Bài Viết (Blog)
*   **[NEW]** [loading.tsx (danh sách blog)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/blog/loading.tsx): Giao diện tải bài viết giả lập chi tiết bao gồm bài viết nổi bật lớn (Hero), các danh mục, lưới danh sách bài viết bên trái và sidebar bên phải.
*   **[MODIFY]** [page.tsx (danh sách blog)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/blog/page.tsx): Tích hợp `<Suspense>` cho trang bài viết.
*   **[MODIFY]** [BlogPageClient.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/components/blog/BlogPageClient.tsx): Sử dụng `useTransition` để hiển thị skeleton lưới bài viết mượt mà khi lọc danh mục hoặc tìm kiếm bài viết.

### D. Trang Chi Tiết Bài Viết (Blog Detail)
*   **[NEW]** [loading.tsx (chi tiết bài viết)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/blog/[slug]/loading.tsx): Tạo skeleton giả lập đầy đủ từ Breadcrumb, Tiêu đề bài viết, Ảnh nổi bật, khung bài viết chi tiết đến sidebar chứa danh mục và bài viết liên quan.
*   **[MODIFY]** [page.tsx (chi tiết bài viết)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/(main)/blog/[slug]/page.tsx): Áp dụng Suspense cho trang chi tiết để hiển thị skeleton lập tức khi click vào đọc bài viết.

---

## 2. Đồng Bộ Giao Diện & Sửa Lỗi Hệ Thống

### A. Tinh chỉnh Màu sắc Skeleton
*   **[MODIFY]** [skeleton.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/components/ui/skeleton.tsx): Thay đổi màu nền mặc định từ `bg-accent` (bị lệch màu hoặc quá tối tùy thuộc vào theme) sang màu xám/trắng trung tính (`bg-slate-200/70 dark:bg-slate-800/70`) giúp hiệu ứng tải nhìn nhẹ nhàng, cao cấp và thống nhất hơn.

### B. Quản Lý Việc Làm Đã Lưu Hết Hạn
*   **[MODIFY]** [page.tsx (việc làm đã lưu của ứng viên)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/saved/page.tsx): Kiểm tra hạn chót nộp hồ sơ (`deadline`) của từng công việc đã lưu. Nếu công việc đã hết hạn (`days < 0`), nút **Ứng tuyển** sẽ tự động được chuyển sang trạng thái vô hiệu hóa và hiển thị nhãn **Hết hạn** (màu xám, không thể bấm), đồng thời người dùng vẫn có thể bấm nút **Bỏ lưu** để dọn dẹp danh sách.

### C. Hiển Thị Đúng Giao Diện Mẫu CV Đã Chọn
*   **[MODIFY]** [page.tsx (trang xem chi tiết CV)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/resumes/[id]/page.tsx): Thay thế việc sử dụng trang in chung chung mặc định bằng việc tải đúng component của mẫu CV mà ứng viên đã chọn (`TEMPLATE_MAP`). Thiết lập chế độ `readOnly={true}` và ẩn đi các đường viền nhập liệu, giúp CV hiển thị đúng thiết kế (màu sắc, cấu trúc cột, font chữ) như lúc soạn thảo.

---

## 3. Sửa Lỗi In CV, Cấu Hình Docker & Đồng Bộ Theme Tối

Ghi nhận các cải tiến lớn liên quan đến cấu trúc trang in CV (Print Page), thiết lập database Docker toàn cục, khởi động backend và sửa lỗi lệch màu nền giao diện tối.

### A. Sửa Lỗi Vỡ Bố Cục Khi In CV & Xuất PDF
*   **[MODIFY]** [page.tsx (In CV Ứng Viên)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/resumes/[id]/print/page.tsx) & [page.tsx (In CV Đơn Tuyển Dụng)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/applications/[id]/resume/print/page.tsx):
    *   Tải động các mẫu CV của ứng viên sử dụng cấu trúc `TEMPLATE_MAP` thay vì giao diện tài liệu in tĩnh cũ.
    *   Ẩn toàn bộ thanh công cụ, thanh Header/Footer mặc định của trình duyệt, thanh điều hướng và khung trò chuyện CopilotKit khi nhấn in.
    *   Ép buộc chiều cao in tối thiểu là `297mm` (khổ A4 chuẩn) và đặt nền trong suốt cho wrapper chính để màu nền CV không bị sọc trắng ở chân trang giấy.
*   **[MODIFY]** [TemplateFuturistic.tsx (Mẫu CV Tech Developer Pro)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/template/TemplateFuturistic.tsx):
    *   Gắn thêm các class định danh ngữ nghĩa `.futuristic-cv-header` và `.futuristic-cv-grid` vào các thẻ Container tương ứng để tạo điểm neo CSS cho bản in.
    *   Đổi màu nền wrapper bên ngoài thành lớp thích ứng theo theme: `bg-slate-100 dark:bg-slate-950`.
*   **[MODIFY]** [globals.css](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/globals.css):
    *   Thêm luật `@media print` cưỡng ép các class di động (`flex-col`, `grid-cols-1`) chuyển sang hiển thị đúng chuẩn màn hình máy tính (`flex-row`, `grid-template-columns: 1fr 260px`) đối với bản in mẫu Tech Developer, sửa lỗi vỡ Avatar và các cột thông tin bị đẩy xuống dưới do khổ giấy in hẹp hơn 768px.
    *   Ép dẹp kích thước in tối đa `width: 100% !important` và căn lề an toàn lề trong `12mm`.

### C. Khắc Phục Lệch Màu Nền Giao Diện Xem Trước CV (Dashboard)
*   **[MODIFY]** [page.tsx (Chi tiết CV ứng viên)](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/resumes/[id]/page.tsx):
    *   Đồng bộ màu nền lớp bảo bọc `.readonly-cv-view` từ `dark:bg-slate-900` thành **`dark:bg-slate-950`** để trùng khớp 100% với màu nền tối bên ngoài của CV.
*   **[MODIFY]** [globals.css](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/globals.css):
    *   Bổ sung khối `@media screen` ẩn hoàn toàn màu nền lớp wrapper mẫu CV trong chế độ xem trước (Dashboard) để các phần tử CV nổi bật tự nhiên trên nền Dashboard mà không có viền lồng viền.

---

## 4. Tích Hợp Hồ Sơ Cá Nhân & Phân Tách CV Gốc

Cải tiến toàn diện trang Hồ sơ cá nhân của ứng viên, phân tách hoàn toàn dữ liệu hồ sơ gốc ra khỏi danh sách các CV đã tạo.

### A. Thay Đổi Database Schema & Đồng Bộ Cấu Trúc
*   **[MODIFY]** [schema.prisma](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/prisma/schema.prisma): Thêm trường `isProfile Boolean @default(false)` vào model `CandidateResume` nhằm đánh dấu bản ghi hồ sơ gốc.


### B. Thiết Lập Điểm Cuối API (Backend)
*   **[MODIFY]** [upload.controller.ts](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/src/modules/upload/upload.controller.ts) & [upload.service.ts](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/src/modules/upload/upload.service.ts): Bổ sung route `POST /api/v1/upload/candidate-avatar` cho phép ứng viên tải lên ảnh đại diện cá nhân lên Cloudinary, đồng thời tự động cập nhật đường dẫn vào bảng `user` và bản ghi hồ sơ gốc của user.
*   **[MODIFY]** [resumes.service.ts](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/src/modules/resumes/resumes.service.ts) & [resumes.controller.ts](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/src/modules/resumes/resumes.controller.ts):
    *   Tích hợp bộ lọc `isProfile: false` vào hàm lấy danh sách CV `findByUser`, ẩn hoàn toàn hồ sơ gốc khỏi danh sách CV tự tạo.
    *   Tạo mới endpoint `GET /resumes/profile` và `PATCH /resumes/profile` tự động khởi tạo hồ sơ gốc nếu chưa có và cập nhật thông tin đồng bộ sang bảng `user`.
*   **[MODIFY]** [dashboard.service.ts](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/backend/src/modules/dashboard/dashboard.service.ts): Lọc điều kiện `isProfile: false` cho bộ đếm và danh sách CV hiển thị ở Dashboard của ứng viên.

*   **[MODIFY]** [profile/page.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/profile/page.tsx):
    *   Tái cấu trúc trang Profile thành dạng Dashboard thông minh với cột bên trái chứa checklist tiến trình hoàn thiện (thông tin cơ bản, ảnh đại diện, kinh nghiệm, học vấn, tóm tắt, mạng xã hội) kèm thanh phần trăm hoàn thành thực tế.
    *   Nhấp vào từng mục checklist sẽ kích hoạt form chỉnh sửa tương ứng bên phải (bao gồm upload ảnh đại diện và thêm/sửa/xóa mượt mà các mục học vấn, kinh nghiệm làm việc).
    *   **[NEW]** Thêm cơ chế **tự động lưu khi chuyển mục** (auto-save on tab switch) và **tự động gom dữ liệu đang gõ dở** (ở form học vấn, kinh nghiệm) để tránh mất mát dữ liệu khi người dùng chuyển mục hoặc tải lại trang (F5).
    *   **[NEW]** Thay thế toàn bộ hộp thoại `alert` mặc định bằng thông báo **Sonner Toast** cao cấp và hiện đại hơn.
    *   **[FLEXIBLE SAVE]** Cho phép ứng viên tự do lưu trữ hồ sơ cá nhân gốc bất cứ lúc nào kể cả khi chưa điền đầy đủ các mục (không chặn lưu nghiêm ngặt) để tăng tính linh hoạt khi soạn thảo.
*   **[MODIFY]** [dashboard/page.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/dashboard/page.tsx): Tải dữ liệu hồ sơ cá nhân gốc từ API mới để tính toán và cập nhật chính xác thanh tiến độ hoàn thiện profile ngay tại giao diện Dashboard.
*   **[MODIFY]** [employer/dashboard/page.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/employer/dashboard/page.tsx): Sửa lỗi cú pháp kiểu dữ liệu TypeScript của biến tham số `n: any` giúp dự án biên dịch thành công 100%.

---

## 5. Tối ưu hóa Logic Hoàn thiện hồ sơ & Ràng buộc Validation

Cải tiến cách tính toán tỉ lệ phần trăm hoàn thành hồ sơ cá nhân và bổ sung các ràng buộc validation chặt chẽ khi ứng viên nhập thông tin học vấn, kinh nghiệm.

### A. Đồng Bộ Logic Tính Phần Trăm & Đánh Dấu Tick
*   **[DATABASE]** Bảng `CandidateResume` sử dụng trường `isProfile` (đánh dấu hồ sơ gốc) để phân tách hoàn toàn dữ liệu.
*   **[COMPLETION LOGIC]** Chuyển đổi cách tính từ **dựa trên số mục (6 mục, ~17% mỗi mục)** sang **dựa trên số ô nhập liệu thực tế (15 ô nhập liệu)** giúp điểm tiến trình tăng tiến chính xác và mượt mà hơn.
*   **[STRICT CHECKLISTS]** Một mục (ví dụ: Thông tin cơ bản, Liên kết mạng xã hội) chỉ được đánh dấu tick hoàn thành **khi ứng viên điền đầy đủ toàn bộ các ô input** trong mục đó thay vì chỉ cần điền 1-2 ô như trước.
*   **[MODIFY]** Đồng bộ toàn diện logic tính toán này trên cả 3 giao diện:
    *   [profile/page.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/profile/page.tsx) (Trang chỉnh sửa)
    *   [dashboard/page.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/app/candidate/dashboard/page.tsx) (Trang tổng quan)
    *   [candidate-sidebar.tsx](file:///home/ngoan/Downloads/thuctap/job-PhuQuoc/web/src/components/layout/candidate-sidebar.tsx) (Thanh điều hướng bên trái)

### B. Ràng Buộc Validation Khi Lưu Thông Tin
*   **[EXPERIENCE & EDUCATION]** Yêu cầu bắt buộc điền đầy đủ cả 5 trường thông tin đối với cả Kinh nghiệm làm việc (Tên công ty, Chức danh, Năm bắt đầu, Năm kết thúc, Mô tả) và Học vấn (Tên trường, Bằng cấp, Ngành học, Năm bắt đầu, Năm kết thúc).
*   **[SPECIFIC ERROR TOASTS]** Thay thế thông báo lỗi chung chung bằng thông báo động chỉ rõ chính xác các ô nhập liệu còn thiếu (ví dụ: `Còn thiếu: Năm kết thúc, Mô tả công việc.`).
*   **[NON-BLOCKING SWITCH]** Tự động bỏ qua validation và không hiển thị thông báo lỗi khi người dùng nhấn **Hủy** hoặc click chuyển sang mục khác khi đang gõ dở, chỉ block và báo lỗi khi người dùng bấm nút **Lưu** một cách chủ động.
*   **[FORM RETENTION]** Nếu việc lưu thông tin bị lỗi hoặc thiếu dữ liệu, form chỉnh sửa sẽ được giữ nguyên trạng thái mở (không tự động đóng lại) để ứng viên có thể tiếp tục hoàn thiện.
*   **[SILENT AUTO-SAVE]** Khi người dùng chuyển tab/mục, hệ thống vẫn tự động lưu ngầm dữ liệu hợp lệ mà không hiển thị thông báo "Lưu thành công" liên tục gây phiền toái.
*   **[FILTER EXPIRED SAVED JOBS]** Tự động lọc bỏ (không hiển thị) những việc làm đã hết hạn nộp hồ sơ khỏi danh sách "Việc làm đã lưu" tại trang Dashboard của ứng viên.
*   **[APPLIED STATUS ON JOB DETAIL]** Ở trang chi tiết công việc, tự động kiểm tra xem ứng viên đang đăng nhập đã nộp đơn cho công việc này chưa. Nếu đã nộp (hoặc nộp thành công), nút **Ứng tuyển ngay** ở cả bản PC (sidebar) và bản Mobile (sticky bar) sẽ tự động chuyển thành **Đã ứng tuyển** (màu xanh lá, có icon check và disable click).

