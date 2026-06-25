# Nhật ký thực hiện (HuynhhThanh)

## Ngày 13/06/2026

### 1. Khắc phục lỗi PM2 trên Windows

- **Vấn đề**: Khi chạy `npm run dev`, quá trình khởi động bị lỗi `[PM2][ERROR] Error: Interpreter /bin/bash is NOT AVAILABLE in PATH`.
- **Nguyên nhân**: Trong tệp `ecosystem.config.js`, dịch vụ `agent` (viết bằng Python/Shell) có dòng `interpreter: '/bin/bash'`, không tương thích và không tồn tại mặc định trên hệ điều hành Windows của bạn.
- **Giải pháp**: Xóa/Tạm ẩn dịch vụ `agent` khỏi cấu hình PM2 (`ecosystem.config.js`), vì bạn hiện tại chỉ cần chạy Frontend và Backend. Các dịch vụ `frontend`, `backend` và `inngest` đã khởi chạy thành công.

### 2. Sửa lỗi số liệu lọc hiển thị `(0)` (Real Data Filter Stats)

- **Vấn đề**: Các thanh lọc như Ngành nghề, Cấp bậc, Mức lương ở trang `/jobs` hiển thị số đếm là `(0)` dù có hơn 3.000 việc làm.
- **Nguyên nhân**: Backend chưa được `re-build` sau khi tải code từ nhánh `main`. Do đó, Next.js gọi API `/api/v1/jobs/stats` thì gặp lỗi `404 Job not found` ở backend cũ.
- **Giải pháp**: Chạy lệnh `npm run build` ở thư mục `backend` và khởi động lại PM2. API lấy thống kê số liệu đã hoạt động và trả về các số liệu thực từ database.

### 3. Hiển thị gợi ý Tìm Nhanh (Quick Tags) thực tế

- **Vấn đề**: Các thẻ tìm nhanh trong thanh tìm kiếm việc làm (JobsHero.tsx) đang sử dụng một mảng tĩnh (hardcode) như "Lễ tân khách sạn", "Bếp trưởng", v.v.
- **Giải pháp**: Đã thay thế mảng tĩnh này bằng dữ liệu danh mục thực tế (`categories`) từ Database để hiển thị linh hoạt 7 danh mục hot nhất.

### 4. Yêu cầu đăng nhập khi Ứng Tuyển & Lưu Việc Làm

- **Vấn đề**: Nút "Ứng tuyển ngay" và "Lưu việc làm" trong trang chi tiết việc làm (`JobDetailClient.tsx`) chưa được bảo vệ.
- **Giải pháp**:
  - Tích hợp `useAuth` và `useRouter`.
  - Cập nhật logic: Nếu người dùng chưa đăng nhập, tự động chuyển hướng (`router.push`) sang trang `/auth/login?redirect=/jobs/[slug]`.
  - Gọi API lấy trạng thái `isSaved` thực tế của công việc đó khi trang vừa được tải để cập nhật UI nút "Lưu việc làm".

### 5. Tối ưu trang Blog (FE & BE) với dữ liệu thật

- **Vấn đề**: Người dùng lo ngại dữ liệu trên trang Blog bị làm giả (mock data tĩnh).
- **Phân tích**: Thực tế Frontend đang gọi đến `http://localhost:3000/api/v1/blogs` và `api/v1/blog-categories` của Backend để lấy danh sách bài viết chuẩn từ Database PostgreSQL.
- **Giải pháp**:
  - Gỡ bỏ một số con số tĩnh trên UI (như `148 yêu thích`, `8 phút đọc`, `350+ vị trí tuyển dụng`). Thay bằng tính toán logic dựa trên độ dài `blog.content` hoặc để số liệu là `0` để chờ cập nhật thật.
  - Viết chú thích (Comment Header) cực kỳ rõ ràng ở đầu các tệp: `page.tsx`, `BlogPageClient.tsx`, `BlogDetailClient.tsx`, `BlogCard.tsx`, và `blogs.controller.ts` để giải thích luồng trao đổi dữ liệu từ Backend đến Frontend để bạn dễ dàng theo dõi.

## Ngày 16/06/2026

### 6. Khắc phục lỗi đăng nhập và chuyển hướng trang (Login & Redirect)

- **Vấn đề**: Hai tài khoản mẫu (`candidate@phuquoc.jobs` và `employer@phuquoc.jobs`) không thể đăng nhập do file seed trước đó chưa tạo mật khẩu trong hệ thống Better Auth. Ngoài ra sau khi đăng nhập thành công, hệ thống văng trở lại trang đăng nhập (vòng lặp vô hạn) thay vì vào thẳng Dashboard.
- **Nguyên nhân**:
  1. Trong file `seed.ts`, các tài khoản mẫu chỉ được tạo `user` mà thiếu phần `account` kèm mật khẩu.
  2. Better Auth được cấu hình mặc định dùng `redisStorage` để lưu phiên làm việc (session). Tuy nhiên dịch vụ Redis cục bộ đang gặp sự cố (`ECONNREFUSED` ở port 6381) nên token được tạo ra mà session thì bị Better Auth lưu xịt. Dẫn tới khi vào trong Dashboard, Backend xác thực lại token đó thì không thấy trên Database -> Trả về lỗi 401 Invalid Session và hất người dùng văng ra màn hình Đăng nhập.
  3. Bảng `jwks` bị kẹt khóa cũ không giải mã được do lệch SECRET KEY.
- **Giải pháp**:
  - **Sửa seed**: Bổ sung logic băm mật khẩu (dùng `bcryptjs`) và tạo thêm bản ghi `account` (với mật khẩu chuẩn `Candidate123!`, `Employer123!`, `Admin123!`) trong tệp `backend/prisma/seed.ts` để những lần Reset DB sau luôn tạo đủ tài khoản.
  - **Chạy lệnh tạo người dùng thật**: Thiết lập hai tài khoản chuẩn trong Database thông qua script.
  - **Khắc phục lỗi xác thực vòng lặp vô hạn**: Vào `backend/src/auth/auth.ts`, **Vô hiệu hóa việc lưu session qua Redis**. Better Auth sẽ tự động dùng PostgreSQL (bảng `session`) để lưu phiên làm việc.
  - **Dọn dẹp JWT Key cũ**: Viết script dọn dẹp bảng `jwks` để Better Auth tự sinh lại mã bảo mật. Tiến hành `npm run build` Backend và `pm2 restart` để tất cả thay đổi trên Backend được áp dụng triệt để.
  - Nhờ vậy, hiện tại mọi thứ đăng nhập hoàn hảo, vào thẳng Dashboard tương ứng tùy vào vai trò (Candidate / Employer).

## Ngày 25/06/2026

### 7. Phân tích task Blog & Dashboard Employer

**A. Blog Page:**

- **Vấn đề**: Cần định dạng lại hiển thị thời gian đăng và bỏ hoàn toàn các thông tin "thời gian đọc".
- **Tiến độ**: ✅ **Đã hoàn thành**
- **Chi tiết thực thi**:
  - `BlogHero.tsx`: Đã xóa bỏ đoạn hiển thị "8 phút đọc". Đã gắn Universal Header Template.
  - `BlogDetailClient.tsx`: Đã xóa bỏ thẻ hiển thị `{readTime} phút đọc` và gỡ bỏ biến tính toán `readTime`. Đã gắn Universal Header Template.
  - `BlogPageClient.tsx`: Đã bọc `b.createdAt` bằng `Intl.DateTimeFormat` để format ngày thành chuẩn `dd/MM/yyyy`, đồng bộ thời gian trên toàn bộ thẻ và bài viết. Đã gắn Universal Header Template.
  - `BlogCard.tsx`: Tự động nhận định dạng ngày mới.

| Trường         | Nội dung                                                      |
| -------------- | ------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                     |
| **Module**     | `docs`                                                        |
| **Tác giả**    | HuynhhThanh                                                   |
| **Tạo lúc**    | 2026-06-25 09:37 (UTC+7)                                      |
| **Người sửa**  | HuynhhThanh                                                   |
| **Loại**       | Sửa lỗi / Tính năng                                           |
| **Mức độ**     | M (2-3 files)                                                 |
| **Version**    | `v1.1.0 → v1.2.0`                                             |
| **Tóm tắt**    | Hoàn thành Task A: Xóa phút đọc, format ngày thành dd/MM/yyyy |
| **Lịch sử**    | - [2026-06-25 09:30]: v1.1.0 Phân tích các task theo yêu cầu <br> - [2026-06-25 09:37]: v1.2.0 Hoàn thành Task A (Blog Page) |
| **Chi tiết**   | - Cập nhật BlogHero và BlogDetailClient: gỡ logic phút đọc <br> - Cập nhật BlogPageClient: bọc `createdAt` bằng Intl.DateTimeFormat |
| **Ảnh hưởng**  | - `web/src/components/blog/BlogHero.tsx` <br> - `web/src/components/blog/BlogDetailClient.tsx` <br> - `web/src/components/blog/BlogPageClient.tsx` |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table)     |
| **Test / CI**  | ✅ Pass                                                       |
| **Trạng thái** | ✅ Hoàn thành                                                 |

### Task 2: Dashboard Employer - Tích hợp React Quill

- **Vấn đề**: Hiện DB lưu text bài đăng là HTML thô, khó cho Employer thao tác nhập liệu. Đồng thời, HTML làm tăng dung lượng lưu trữ và khó đọc khi Dev muốn kiểm tra data trực tiếp. Yêu cầu: Vẫn dùng giao diện soạn thảo trực quan (React Quill) nhưng ngầm chuyển sang Markdown để lưu DB.
- **Hướng giải quyết**:
  - **Phase 1 (Đã xong)**: Cài đặt `react-quill`, tạo `RichTextEditor` thay thế cho `<Textarea>`.
  - **Phase 2 (Đang lên kế hoạch - Ngầm chuyển HTML sang Markdown)**:
    1. **Cài đặt thư viện**: Thêm `turndown` (dịch HTML → MD) và `marked` (dịch MD → HTML).
    2. **Lưu dữ liệu (Form Create/Edit)**: Trước khi gửi API (POST/PUT), dùng `turndown` chuyển đổi các trường `description`, `requirements`, `benefits` từ HTML sang Markdown rồi mới lưu DB.
    3. **Hiển thị (Trang Detail)**: Khi đọc từ DB lên, dùng `marked.parse(data)` dịch ngược Markdown thành HTML rồi truyền vào `<RichContent>`. (Thư viện `marked` không làm hỏng thẻ HTML cũ nên tin cũ vẫn hiển thị tốt).
    4. **Phân tích về việc Dev xem dữ liệu DB**: Khi áp dụng cách này, data trong Database mặc định sẽ là chuỗi Markdown thuần (ví dụ: `# Tiêu đề \n - Ý 1`). Do Markdown vốn là định dạng plain-text sinh ra để con người đọc hiểu dễ dàng, nên **Dev chỉ cần mở các công cụ quản lý DB (như DBeaver, pgAdmin, Supabase Studio, TablePlus,...) là có thể đọc trực tiếp rất trực quan**. Hoàn toàn **KHÔNG CẦN** phải code thêm bất kỳ trang Admin hay Tool nào khác chỉ để view data.
- **Tiến độ**: ⏳ **Đang lên kế hoạch Phase 2**
- **Các bước thực thi chi tiết (Phase 2)**:
  1. Cài đặt `turndown` và `marked`.
  2. Sửa `create/page.tsx` tích hợp `turndown` trước lệnh `fetch`.
  3. Sửa `JobContent.tsx` tích hợp `marked` trước `<RichContent>`.
- **Các file bị ảnh hưởng**:
  - `web/package.json`
  - `web/src/app/employer/jobs/create/page.tsx`
  - `web/src/components/jobs/JobContent.tsx`

| Trường         | Nội dung                                                      |
| -------------- | ------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                     |
| **Module**     | `docs`                                                        |
| **Tác giả**    | HuynhhThanh                                                   |
| **Tạo lúc**    | 2026-06-25 13:45 (UTC+7)                                      |
| **Người sửa**  | AI Agent (Antigravity)                                        |
| **Loại**       | Tính năng / Docs                                              |
| **Mức độ**     | M (2-3 files)                                                 |
| **Version**    | `v1.3.4 → v1.3.5`                                             |
| **Tóm tắt**    | Tích hợp React Quill và phân tích chuyển MD ngầm (Phase 2)    |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.0 Phân tích Task 2 <br> - [2026-06-25 10:57]: v1.3.4 Thực thi tích hợp React Quill <br> - [2026-06-25 13:45]: v1.3.5 Lên kế hoạch Phase 2 (Convert Markdown) |
| **Chi tiết**   | - Phase 1: Tạo `RichTextEditor`, thay `Textarea` trong form <br> - Phase 2: Lên KH dùng `turndown` & `marked` convert HTML sang MD. Đánh giá Dev có thể đọc trực tiếp từ DB. |
| **Ảnh hưởng**  | - `web/package.json` <br> - `web/src/components/ui/RichTextEditor.tsx` <br> - `web/src/app/employer/jobs/create/page.tsx` <br> - `web/src/components/jobs/JobContent.tsx` |
| **Ghi chú**    | Bảng đã được gộp từ 2 bảng cũ thành 1 Universal Table         |
| **Test / CI**  | ⏳ Chưa chạy Phase 2 (Phase 1 đã pass)                        |
| **Trạng thái** | ⏳ Đang chờ duyệt Phase 2                                     |

---

### Task 3: Dashboard Employer - Format Mức Lương

- **Vấn đề**: Yêu cầu nhập lương phải hiển thị dạng số thân thiện (ví dụ 10.000), nhưng khi gửi lên API cần định dạng số nguyên (10000).
- **Hướng giải quyết (Phân tích định dạng tiền tệ)**:
  - Có 2 cách:
    - **Cách 1 (Tự viết tay)**: Thêm hàm `formatCurrency(value)` dùng RegEx.
    - **Cách 2 (Dùng thư viện `react-number-format`)**: Cài thư viện và dùng component `<NumericFormat />`.
  - **Đề xuất**: Dùng **Cách 2** vì handle việc nhập liệu cực kì an toàn, tránh lỗi con trỏ bị nhảy lung tung khi gõ số.
- **Tiến độ**: ⏳ **Đang chờ triển khai**
- **Các bước thực thi chi tiết**:
  1. Cài đặt thư viện: Chạy lệnh `pnpm add react-number-format`.
  2. Cập nhật form (`create/page.tsx` và `edit/page.tsx`): Thay input thông thường bằng `<NumericFormat />`.
  3. Cấu hình props: `thousandSeparator="."`, `decimalSeparator=","`, `suffix=" VND"` và cập nhật state dạng số nguyên qua `onValueChange`.
- **Các file bị ảnh hưởng**:
  - `web/package.json`
  - `web/src/app/(employer)/employer/jobs/create/page.tsx`
  - `web/src/app/(employer)/employer/jobs/[id]/edit/page.tsx`

| Trường         | Nội dung                                                      |
| -------------- | ------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                     |
| **Module**     | `docs`                                                        |
| **Tác giả**    | HuynhhThanh                                                   |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                      |
| **Người sửa**  | HuynhhThanh                                                   |
| **Loại**       | Tính năng                                                     |
| **Mức độ**     | S (1 file)                                                    |
| **Version**    | `v1.3.0 → v1.3.1`                                             |
| **Tóm tắt**    | Lên kế hoạch triển khai Task 3 (Format Lương)                 |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.1 Phân tích Task 3                 |
| **Chi tiết**   | - Lên plan các bước, danh sách file ảnh hưởng cho Task 3      |
| **Ảnh hưởng**  | - `web/src/app/(employer)/employer/jobs/create/page.tsx` <br> - `web/src/app/(employer)/employer/jobs/[id]/edit/page.tsx` |
| **Ghi chú**    | Cần cài đặt `react-number-format`                             |
| **Test / CI**  | ⏳ Chưa chạy                                                  |
| **Trạng thái** | ⏳ Đang chờ                                                   |

---

### Task 4: Dashboard Employer - Hồ sơ công ty

- **Yêu cầu**: Thiết kế lại tab "Hồ sơ công ty" như ảnh mockup (cần cung cấp thêm ảnh để code chuẩn), và sau khi điền thì quay về trang Công Ty cũng phải hiển thị đúng các thông tin này.
- **Hướng giải quyết**: Mở component trang "Hồ sơ công ty" (`app/employer/company/page.tsx`). Dàn lại layout form theo yêu cầu thẩm mỹ của thiết kế. Bổ tiếp các API lấy/cập nhật profile, sau đó đồng bộ state vào cả form và trang public company detail.
- **Tiến độ**: ⏳ **Đang chờ thiết kế / triển khai**
- **Các bước thực thi chi tiết**:
  1. Dàn lại layout giao diện `app/employer/company/page.tsx` theo bản thiết kế chuẩn.
  2. Map form với API gửi dữ liệu chuẩn xác.
  3. Kiểm tra trang `companies/[id]/page.tsx` (public) để xác nhận hiển thị.
- **Các file bị ảnh hưởng**:
  - `web/src/app/(employer)/employer/company/page.tsx`
  - `web/src/app/companies/[id]/page.tsx` (nếu có chỉnh sửa hiển thị)

| Trường         | Nội dung                                                      |
| -------------- | ------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                     |
| **Module**     | `docs`                                                        |
| **Tác giả**    | HuynhhThanh                                                   |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                      |
| **Người sửa**  | HuynhhThanh                                                   |
| **Loại**       | Tính năng                                                     |
| **Mức độ**     | M (2-3 files)                                                 |
| **Version**    | `v1.3.1 → v1.3.2`                                             |
| **Tóm tắt**    | Lên kế hoạch triển khai Task 4 (Hồ sơ công ty)                |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.2 Phân tích Task 4                 |
| **Chi tiết**   | - Lên plan các bước, danh sách file ảnh hưởng cho Task 4      |
| **Ảnh hưởng**  | - `web/src/app/(employer)/employer/company/page.tsx` <br> - `web/src/app/companies/[id]/page.tsx` |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table)     |
| **Test / CI**  | ⏳ Chưa chạy                                                  |
| **Trạng thái** | ⏳ Đang chờ                                                   |

---

### Task 5: Rà soát các tab khác trong Employer

- **Phạm vi**: Tab Cài đặt (Settings), Thông báo (Notifications), Bảng điều khiển (Dashboard)... Tuyệt đối không đụng vào "Hồ sơ ứng viên" và "Quản lý đăng tin".
- **Hướng giải quyết**: Đi rà soát UI xem có vỡ layout không, click xem các API endpoint có bị lỗi 404/500 không. Nếu lỗi nhẹ tự fix, lỗi to báo cáo.
- **Tiến độ**: ⏳ **Chưa bắt đầu**
- **Các bước thực thi chi tiết**:
  1. Truy cập trực tiếp các tab Settings, Notifications, Dashboard từ sidebar.
  2. Kiểm tra console log, Network tab. Ghi nhận lỗi và xử lý.

| Trường         | Nội dung                                                      |
| -------------- | ------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                     |
| **Module**     | `docs`                                                        |
| **Tác giả**    | HuynhhThanh                                                   |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                      |
| **Người sửa**  | HuynhhThanh                                                   |
| **Loại**       | Sửa lỗi                                                       |
| **Mức độ**     | L (Module)                                                    |
| **Version**    | `v1.3.2 → v1.3.3`                                             |
| **Tóm tắt**    | Lên kế hoạch rà soát UI các tab khác (Task 5)                 |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.3 Phân tích Task 5                 |
| **Chi tiết**   | - Lên plan các bước rà soát lỗi 404/500 và layout             |
| **Ảnh hưởng**  | - Các trang nội bộ trong Dashboard (trừ Hồ sơ ứng viên)       |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table)     |
| **Test / CI**  | ⏳ Chưa chạy                                                  |
| **Trạng thái** | ⏳ Đang chờ                                                   |
