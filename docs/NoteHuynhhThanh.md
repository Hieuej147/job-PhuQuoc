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
