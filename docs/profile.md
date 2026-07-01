# Trang Hồ Sơ Cá Nhân (`/candidate/profile`)

> **Cập nhật:** 21/06/2026  
> **Các file mới/đã chỉnh sửa:**
> - `web/src/app/candidate/profile/page.tsx`
> - `web/src/components/profile/PersonalInfoSection.tsx`
> - `web/src/components/profile/ExperienceSection.tsx`
> - `web/src/components/profile/EducationSection.tsx`
> - `web/src/components/profile/ProjectSection.tsx`
> - `web/src/components/profile/SocialSection.tsx`
> - `web/src/components/profile/SecuritySection.tsx`

---

## Tổng quan thay đổi

Trang `/candidate/profile` đã được tái cấu trúc thành một trang quản lý hồ sơ chuyên nghiệp với giao diện tab cực kỳ trực quan và cấu trúc code sạch (mỗi chức năng tách riêng thành 1 file component con nằm trong thư mục `src/components/profile`).

---

## Cấu trúc các Tab chức năng

### 1. Thông tin cá nhân
- **Ảnh đại diện:** Hỗ trợ upload ảnh trực tiếp (tự động chuyển đổi thành Base64 và lưu vào trường `image` của User profile trên DB). Giới hạn dung lượng dưới 5MB. Có nút xóa ảnh.
- **Họ và tên:** Cho phép cập nhật và tự động lấy chữ cái đầu (initials) hiển thị làm avatar mặc định khi chưa upload ảnh.
- **Email:** Bị khóa (disabled) kèm icon ổ khóa, hiển thị dòng chú thích không thể thay đổi sau đăng ký.
- **Số điện thoại:** Cho phép cập nhật.
- **Địa chỉ hiển thị trên CV:** Cập nhật địa chỉ hiển thị.
- **Trình độ học vấn cao nhất:** Dropdown lựa chọn cấp bậc (Trung học, Trung cấp, Cao đẳng, Đại học, Sau đại học).
- **Ngôn ngữ:** Trường nhập văn bản (Ví dụ: Tiếng Việt (bản ngữ), Tiếng Anh (B2)).
- **Tóm tắt bản thân:** Hỗ trợ mô tả bản thân giới hạn tối đa 500 ký tự với bộ đếm realtime dưới góc.

### 2. Kinh nghiệm làm việc
- Danh sách kinh nghiệm làm việc hiển thị dưới dạng các card riêng biệt.
- Cho phép thêm mới, xóa và chỉnh sửa thông tin các trường:
  - Tên công ty
  - Chức danh / Vị trí
  - Năm bắt đầu / Năm kết thúc
  - Mô tả chi tiết công việc.

### 3. Học vấn & Bằng cấp
- Danh sách lịch sử học vấn.
- Cho phép thêm mới, xóa và chỉnh sửa:
  - Tên trường
  - Bằng cấp / Khóa học
  - Ngành học
  - Điểm trung bình (GPA)
  - Năm bắt đầu / Năm kết thúc
  - Mô tả / Hoạt động khác.

### 4. Dự án
- Danh sách dự án cá nhân hoặc dự án đã tham gia.
- Hỗ trợ thêm mới, xóa và chỉnh sửa:
  - Tên dự án
  - Vai trò trong dự án
  - Đường dẫn dự án (Link demo/source)
  - Mô tả chi tiết dự án.

### 5. Mạng xã hội
- Quản lý các liên kết đến các nền tảng mạng xã hội khác.
- Lựa chọn dropdown: Facebook, LinkedIn, GitHub, Zalo, Website, Khác.
- Nhập đường dẫn URL tương ứng.

### 6. Bảo mật
- Form đổi mật khẩu bảo mật tài khoản.
- Tích hợp trực tiếp với SDK `better-auth/client` thông qua phương thức `authClient.changePassword`.
- Có mắt ẩn/hiện mật khẩu cho cả 3 trường: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.

---

## Chi tiết kỹ thuật & Tích hợp API

### Tách biệt dữ liệu Hồ sơ cá nhân với danh sách CV (`PROFILE_MASTER`)

Để lưu giữ dữ liệu Hồ sơ cá nhân tách biệt và không bị hiển thị chồng chéo với danh sách CV của ứng viên, hệ thống sử dụng cơ chế định danh ẩn:
1. **Thông tin tài khoản:** `name`, `phone`, `image` được lưu thông qua endpoint `PATCH /api/v1/auth/me`.
2. **Thông tin chi tiết Hồ sơ:** `address`, `degree`, `languages`, `summary`, `experience`, `education`, `projects`, `socialLinks` được lưu vào một bản ghi CV đặc biệt có tiêu đề `title: "PROFILE_MASTER"`.
   - Trang **Hồ sơ cá nhân** (`/candidate/profile`) sẽ luôn tìm và cập nhật đúng bản ghi này.
   - Trang **Danh sách CV của tôi** (`/candidate/resumes`) và **Form ứng tuyển nhanh** khi nộp hồ sơ đều được bộ lọc (`filter`) loại bỏ các bản ghi có tiêu đề `PROFILE_MASTER`.
   - Nhờ vậy, người dùng sẽ có một bộ thông tin Hồ sơ cá nhân độc lập mà không sợ làm ảnh hưởng hay hiển thị nhầm lẫn với các file CV thiết kế riêng lẻ.

### Quản lý Trạng thái & Giao diện
- Toàn bộ UI được thiết kế hỗ trợ Responsive và tự động đồng bộ theo Theme màu (Light/Dark/System) của ứng dụng PQJobs.
- Các button "Lưu thay đổi" hiển thị trạng thái `saving` (Đang lưu...) khi đang gửi request và hiển thị thông báo kết quả qua `sonner` toast.
