<!--
# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATE FILE HEADER & CHANGELOG — HuynhhThanh
# Dùng cho mọi dự án · Copy nguyên khối comment vào đầu file hoặc file log Note
# ─────────────────────────────────────────────────────────────────────────────

==============================================================================
 File    : docs/NoteHuynhhThanh.md
 Module  : docs
 Tóm tắt : Phân tích các task Blog và Dashboard Employer
 Tác giả : HuynhhThanh
 Tạo lúc : 2026-06-25 09:30 (UTC+7)
 Encode  : UTF-8
 Version : 1.1.0
           · MAJOR → tăng khi: thay đổi không tương thích ngược (breaking)
           · MINOR → tăng khi: thêm tính năng mới, không phá vỡ cũ
           · PATCH → tăng khi: sửa lỗi, không thay đổi hành vi (behavior)
 Lịch sử :
 - [2026-06-25 09:30] v1.1.0 : Phân tích các task theo yêu cầu
 - [2026-06-25 09:37] v1.2.0 : Hoàn thành Task A (Blog Page)
------------------------------------------------------------------------------
 Changelog — lần thay đổi gần nhất
------------------------------------------------------------------------------
 | Trường          | Nội dung                                                |
 |-----------------|----------------------------------------------------------|
 | **Người sửa**   | AI Agent (Antigravity)                                   |
 | **Loại**        | Sửa lỗi / Tính năng                                      |
 | **Mức độ**      | M (2-3 files)                                            |
 | **Version**     | `v1.1.0 → v1.2.0`                                        |
 | **PR / Issue**  | Không                                                    |
 | **Reviewer**    | HuynhhThanh · ⏳ Pending                                 |
 | **Tóm tắt**     | Thực thi hoàn tất Task A: Bỏ phút đọc, format ngày     |
 | **Phụ thuộc**   | Không                                                    |
 | **Skill/Tool**  | multi_replace_file_content                               |
 | **Chi tiết**    | - Xóa các đoạn text tĩnh/động "phút đọc" trong BlogHero  |
 |                 |   và BlogDetailClient.                                   |
 |                 | - Đã format ngày tháng trong BlogPageClient (dd/MM/yyyy).|
 |                 | - Đã gắn Universal Header cho các tệp đã sửa.            |
 | **Ảnh hưởng**   | - web/src/components/blog/BlogHero.tsx                   |
 |                 | - web/src/components/blog/BlogDetailClient.tsx           |
 |                 | - web/src/components/blog/BlogPageClient.tsx             |
 | **Ghi chú**     | Code đã được sửa đúng vị trí, hoàn thành Task A.         |
 | **Test / CI**   | ⏳ Chưa chạy                                               |
 | **Trạng thái**  | ✅ Hoàn thành                                              |
==============================================================================
-->

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

**B. Dashboard Employer - Đăng tin**:
- **Mô tả công việc, Yêu cầu, Quyền lợi**:
  - **Vấn đề**: Hiện DB lưu text bài đăng là HTML thô, khó cho Employer thao tác nhập liệu dù khi lên iframe chi tiết thì đẹp.
  - **Hướng giải quyết**: Thay vì bắt người dùng nhập mã thẻ HTML bằng tay, sẽ tích hợp một **Rich Text Editor** (Trình soạn thảo văn bản phong phú như TipTap, React Quill, hoặc TinyMCE) vào form đăng tuyển. Bộ editor này có các nút in đậm, in nghiêng, gạch đầu dòng rất trực quan. Sau khi viết xong trên form, editor sẽ tự render ra format HTML sạch để lưu xuống database. Cách này giải quyết được mâu thuẫn: form nhập cực kỳ dễ dùng mà iframe hiển thị thì vẫn giữ nguyên được độ đẹp và định dạng gốc.
- **Mức Lương**:
  - **Vấn đề**: Yêu cầu nhập lương phải hiển thị dạng số thân thiện (ví dụ 10.000), nhưng khi gửi lên API cần định dạng số nguyên (10000).
  - **Hướng giải quyết**: Dùng input có chức năng mask tiền tệ (như thư viện `react-number-format` hoặc tự viết hàm format `onChange`). Khi người dùng gõ số, form sẽ tự parse và hiển thị phân cách hàng nghìn (10.000), trước khi `onSubmit` sẽ thay thế bỏ dấu `.` rồi ép kiểu thành số `Number` để gọi API Backend an toàn.

**C. Dashboard Employer - Hồ sơ công ty**:
- **Yêu cầu**: Thiết kế lại tab "Hồ sơ công ty" như ảnh mockup (cần cung cấp thêm ảnh để code chuẩn), và sau khi điền thì quay về trang Công Ty cũng phải hiển thị đúng các thông tin này.
- **Hướng giải quyết**: Mở component trang "Hồ sơ công ty" (`app/employer/company/page.tsx`). Dàn lại layout form theo yêu cầu thẩm mỹ của thiết kế. Bổ sung các API lấy và cập nhật profile công ty (nếu thiếu), sau đó đồng bộ state vào cả form form và trang public company detail.

**D. Rà soát các tab khác trong Employer**:
- **Phạm vi**: Tab Cài đặt (Settings), Thông báo (Notifications), Bảng điều khiển (Dashboard)... Tuyệt đối không đụng vào "Hồ sơ ứng viên" và "Quản lý đăng tin" theo đúng chỉ thị.
- **Hướng giải quyết**: Đi rà soát UI xem có vỡ layout không, click xem các API endpoint có bị lỗi 404/500 không. Nếu lỗi nhẹ và chắc chắn đúng logic thì sẽ tự fix, nếu là lỗi to hoặc không chắc thì sẽ chỉ báo cáo lại bằng cách viết log vào file này.

