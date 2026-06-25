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

| Trường         | Nội dung                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                                          |
| **Module**     | `docs`                                                                                                                                             |
| **Tác giả**    | HuynhhThanh                                                                                                                                        |
| **Tạo lúc**    | 2026-06-25 09:37 (UTC+7)                                                                                                                           |
| **Người sửa**  | HuynhhThanh                                                                                                                                        |
| **Loại**       | Sửa lỗi / Tính năng                                                                                                                                |
| **Mức độ**     | M (2-3 files)                                                                                                                                      |
| **Version**    | `v1.1.0 → v1.2.0`                                                                                                                                  |
| **Tóm tắt**    | Hoàn thành Task A: Xóa phút đọc, format ngày thành dd/MM/yyyy                                                                                      |
| **Lịch sử**    | - [2026-06-25 09:30]: v1.1.0 Phân tích các task theo yêu cầu <br> - [2026-06-25 09:37]: v1.2.0 Hoàn thành Task A (Blog Page)                       |
| **Chi tiết**   | - Cập nhật BlogHero và BlogDetailClient: gỡ logic phút đọc <br> - Cập nhật BlogPageClient: bọc `createdAt` bằng Intl.DateTimeFormat                |
| **Ảnh hưởng**  | - `web/src/components/blog/BlogHero.tsx` <br> - `web/src/components/blog/BlogDetailClient.tsx` <br> - `web/src/components/blog/BlogPageClient.tsx` |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table)                                                                                          |
| **Test / CI**  | ✅ Pass                                                                                                                                            |
| **Trạng thái** | ✅ Hoàn thành                                                                                                                                      |

### Task 2: Dashboard Employer - Tích hợp Tiptap Editor & Lưu Markdown

- **Vấn đề**:
  1. `react-quill` gây lỗi Crash toàn trang (React 19 xóa bỏ `findDOMNode`). Phải gỡ bỏ hoàn toàn.
  2. DB lưu text bài đăng dạng HTML thô làm tăng dung lượng, Dev mở DB đọc rất đau mắt.
- **Giải pháp (Tiptap + Markdown)**:
  - Sử dụng **Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`) vì nó là Headless Editor, tương thích 100% với React 19 / Next.js SSR.
  - Tích hợp thêm gói `tiptap-markdown` để Editor tự động xuất ra chuỗi Markdown sạch sẽ thay vì HTML rác. DB sẽ chỉ nhận Markdown thuần.
  - Phía giao diện Public (Xem tin): Dùng `react-markdown` kết hợp plugin Tailwind `@tailwindcss/typography` (`prose`) để render Markdown ra UI đẹp mắt.
- **Tiến độ**: ⏳ **Đang lên kế hoạch (Plan)**
- **Plan (R-T-P-A-V)**:
  - **[x] Sub-task 1 (Dọn dẹp & Cài đặt)**:
    - Gỡ bỏ thư viện cũ: `pnpm remove react-quill`.
    - Cài đặt Tiptap: `pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit tiptap-markdown`.
    - Cài đặt bộ render UI: `pnpm add react-markdown @tailwindcss/typography rehype-raw`.
  - **[x] Sub-task 2 (Build Tiptap Editor)**:
    - Làm lại file `src/components/ui/RichTextEditor.tsx`.
    - Tạo một Toolbar gắn các nút In đậm, In nghiêng, List (Sử dụng icon `lucide-react` và UI chuẩn Shadcn).
    - Cấu hình `onUpdate` để bắn ra giá trị Markdown (thông qua `editor.storage.markdown.getMarkdown()`).
  - **[x] Sub-task 3 (Form Integration)**:
    - Giữ nguyên `create/page.tsx` vì API của `RichTextEditor` mới không thay đổi (`value, onChange, placeholder`). Code được tối ưu hoàn hảo drop-in replacement.
  - **[x] Sub-task 4 (Public Render)**:
    - Cập nhật file `globals.css` để thêm plugin typography `@plugin "@tailwindcss/typography"`.
    - Sửa file `src/components/ui/rich-content.tsx` để render Markdown bằng `react-markdown` kết hợp `rehype-raw` bọc trong class `prose` (Đảm bảo tương thích ngược với data HTML cũ trong DB).

| Trường         | Nội dung                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                                                                               |
| **Module**     | `docs`                                                                                                                                                                                  |
| **Tác giả**    | HuynhhThanh                                                                                                                                                                             |
| **Tạo lúc**    | 2026-06-25 15:15 (UTC+7)                                                                                                                                                                |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                                                                                  |
| **Loại**       | Tính năng / UI                                                                                                                                                                          |
| **Mức độ**     | L (>3 files)                                                                                                                                                                            |
| **Version**    | `v1.3.6 → v1.3.7`                                                                                                                                                                       |
| **Tóm tắt**    | Tích hợp thành công Tiptap Editor và Markdown Render                                                                                                                                    |
| **Lịch sử**    | - [2026-06-25 13:45]: v1.3.5 Dùng React Quill (Thất bại do Crash React 19) <br> - [2026-06-25 15:00]: v1.3.6 Chuyển sang Tiptap & Markdown <br> - [2026-06-25 15:15]: v1.3.7 Hoàn tất code Tiptap |
| **Chi tiết**   | - Build custom Toolbar (Lucide) cho Tiptap, tự động parse ra Markdown. <br> - Viết lại `RichContent` bằng `react-markdown` + `rehype-raw` để vừa render Markdown đẹp, vừa không làm hỏng tin tuyển dụng HTML cũ. <br> - Thêm Tailwind Typography plugin. |
| **Ảnh hưởng**  | - `web/package.json` <br> - `web/src/components/ui/RichTextEditor.tsx` <br> - `web/src/app/globals.css` <br> - `web/src/components/ui/rich-content.tsx`                                 |
| **Ghi chú**    | Dev giờ đã có thể dễ dàng đọc data trong DB.                                                                                                                                            |
| **Test / CI**  | ✅ Pass (Editor mount thành công, không Crash SSR)                                                                                                                                       |
| **Trạng thái** | ✅ Hoàn thành                                                                                                                                                                           |

---

### Task 3: Dashboard Employer - Format Mức Lương

**Mục tiêu**: Hiển thị mức lương thân thiện với người dùng (VD: `10.000 VND`) nhưng vẫn gửi dữ liệu số nguyên (VD: `10000`) về Backend, đảm bảo không gặp lỗi nhảy con trỏ khi nhập liệu.

- **Vấn đề**: Yêu cầu nhập lương phải hiển thị dạng số thân thiện (ví dụ 10.000), nhưng khi gửi lên API cần định dạng số nguyên (10000).
- **Hướng giải quyết**: Sử dụng thư viện `react-number-format` vì handle việc nhập liệu cực kì an toàn, tránh lỗi con trỏ nhảy lung tung khi gõ số.
- **Tiến độ**: ⏳ **Đang chờ triển khai**
- **Plan (R-T-P-A-V)**:
  - **[ ] Research**: Kiểm tra cấu trúc Form hiện tại xem input nhập lương nằm ở `create/page.tsx` & `edit/page.tsx` hay trong component dùng chung (ví dụ `JobForm`). Xác định UI framework đang dùng (shadcn).
  - **[ ] Sub-task 1**: Chạy lệnh `pnpm add react-number-format` tại thư mục `web/`.
  - **[ ] Sub-task 2**: Thay thế thẻ Input lương bằng `<NumericFormat customInput={Input} />`. Cấu hình props: `thousandSeparator="."`, `decimalSeparator=","`, `suffix=" VND"`, `allowNegative={false}`. Sử dụng `onValueChange={(values) => field.onChange(values.floatValue)}` để bóc tách giá trị số nguyên lưu vào form state.
  - **[ ] Sub-task 3**: Đảm bảo form Edit tải đúng giá trị cũ và tự parse hiển thị đẹp mắt.
  - **[ ] Verify**: Chạy linter, test trực tiếp giao diện. Đảm bảo payload Submit đúng chuẩn số nguyên.
  - **[ ] Log**: Cập nhật Universal Table ở file code thay đổi & tệp Note này.

| Trường         | Nội dung                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                             |
| **Module**     | `docs`                                                                                                                |
| **Tác giả**    | HuynhhThanh                                                                                                           |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                                                                              |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                |
| **Loại**       | Tính năng / Plan                                                                                                      |
| **Mức độ**     | M (Medium)                                                                                                            |
| **Version**    | `v1.3.1 → v1.3.2`                                                                                                     |
| **Tóm tắt**    | Phân tích chi tiết Plan (R-T-P-A-V) cho Task 3                                                                        |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.1 Lên kế hoạch sơ bộ <br> - [2026-06-25 14:26]: v1.3.2 Lên Plan chi tiết (R-T-P-A-V)       |
| **Chi tiết**   | - Cập nhật plan chi tiết tích hợp `react-number-format` <br> - Lên checklist các việc cần làm (Research, Act, Verify) |
| **Ảnh hưởng**  | - `web/package.json` <br> - Các file UI Form liên quan                                                                |
| **Ghi chú**    | Cần cài đặt `react-number-format`                                                                                     |
| **Test / CI**  | ⏳ Chưa chạy                                                                                                          |
| **Trạng thái** | ⏳ Đang chờ duyệt Plan                                                                                                |

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

| Trường         | Nội dung                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                         |
| **Module**     | `docs`                                                                                            |
| **Tác giả**    | HuynhhThanh                                                                                       |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                                                          |
| **Người sửa**  | HuynhhThanh                                                                                       |
| **Loại**       | Tính năng                                                                                         |
| **Mức độ**     | M (2-3 files)                                                                                     |
| **Version**    | `v1.3.1 → v1.3.2`                                                                                 |
| **Tóm tắt**    | Lên kế hoạch triển khai Task 4 (Hồ sơ công ty)                                                    |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.2 Phân tích Task 4                                                     |
| **Chi tiết**   | - Lên plan các bước, danh sách file ảnh hưởng cho Task 4                                          |
| **Ảnh hưởng**  | - `web/src/app/(employer)/employer/company/page.tsx` <br> - `web/src/app/companies/[id]/page.tsx` |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table)                                         |
| **Test / CI**  | ⏳ Chưa chạy                                                                                      |
| **Trạng thái** | ⏳ Đang chờ                                                                                       |

---

             |---

### Task 5: Rà soát các tab khác trong Employer

- **Phạm vi**: Tab Cài đặt (Settings), Thông báo (Notifications), Bảng điều khiển (Dashboard)... Tuyệt đối không đụng vào "Hồ sơ ứng viên" và "Quản lý đăng tin".
- **Hướng giải quyết**: Đi rà soát UI xem có vỡ layout không, click xem các API endpoint có bị lỗi 404/500 không. Nếu lỗi nhẹ tự fix, lỗi to báo cáo.
- **Tiến độ**: ⏳ **Chưa bắt đầu**
- **Các bước thực thi chi tiết**:
  1. Truy cập trực tiếp các tab Settings, Notifications, Dashboard từ sidebar.
  2. Kiểm tra console log, Network tab. Ghi nhận lỗi và xử lý.

| Trường         | Nội dung                                                  |
| -------------- | --------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                 |
| **Module**     | `docs`                                                    |
| **Tác giả**    | HuynhhThanh                                               |
| **Tạo lúc**    | 2026-06-25 10:35 (UTC+7)                                  |
| **Người sửa**  | HuynhhThanh                                               |
| **Loại**       | Sửa lỗi                                                   |
| **Mức độ**     | L (Module)                                                |
| **Version**    | `v1.3.2 → v1.3.3`                                         |
| **Tóm tắt**    | Lên kế hoạch rà soát UI các tab khác (Task 5)             |
| **Lịch sử**    | - [2026-06-25 10:35]: v1.3.3 Phân tích Task 5             |
| **Chi tiết**   | - Lên plan các bước rà soát lỗi 404/500 và layout         |
| **Ảnh hưởng**  | - Các trang nội bộ trong Dashboard (trừ Hồ sơ ứng viên)   |
| **Ghi chú**    | Đã format lại bảng theo rule mới (Single Universal Table) |
| **Test / CI**  | ⏳ Chưa chạy                                              |
| **Trạng thái** | ⏳ Đang chờ                                               |

### 6. Khắc phục lỗi Hydration (React Hydration Error)

- **Vấn đề**: Khi truy cập trang `http://localhost:3001/employer/jobs/create` hoặc các trang khác, trình duyệt báo lỗi `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties`.
- **Phân tích log lỗi**: Trong đoạn log bạn cung cấp, xuất hiện các thuộc tính lạ bị chèn vào thẻ `<body>` và `<div>` như:
  - `bis_skin_checked="1"`
  - `bis_register="..."`
  - `__processed_...="true"`
- **Nguyên nhân**: Lỗi này **KHÔNG PHẢI DO CODE DỰ ÁN**. Nguyên nhân là do một **Browser Extension** (tiện ích mở rộng của trình duyệt) trên máy bạn đã tự động thay đổi cấu trúc HTML (DOM) ngay trước khi React kịp thực hiện quá trình Hydration. Dấu hiệu `bis_skin_checked` đặc trưng xuất phát từ các extension bảo mật/tải file như **Bitdefender (Anti-tracker/Wallet)**, **Internet Download Manager (IDM)**, hoặc trình quản lý mật khẩu.
- **Giải pháp xử lý (Không cần sửa code)**:
  - **Cách 1 (Nhanh nhất)**: Sử dụng chế độ **Ẩn danh (Incognito Mode)** để chạy test dự án ở môi trường dev.
  - **Cách 2**: Tắt/Vô hiệu hóa (Disable) các extension như Bitdefender, IDM cho trang `localhost:3001`.
  - _(Lưu ý: Bạn không cần phải tìm cách thêm `suppressHydrationWarning` vào thẻ div vì extension này chèn mã độc đoán vào rất nhiều thẻ trên trang)._

| Trường         | Nội dung                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                  |
| **Module**     | `frontend`                                                                                                                 |
| **Tác giả**    | HuynhhThanh                                                                                                                |
| **Tạo lúc**    | 2026-06-25 14:35 (UTC+7)                                                                                                   |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                     |
| **Loại**       | Sửa lỗi                                                                                                                    |
| **Mức độ**     | S (1 file)                                                                                                                 |
| **Version**    | `v1.3.3 → v1.3.4`                                                                                                          |
| **Tóm tắt**    | Phân tích lỗi React Hydration Error do Browser Extension                                                                   |
| **Lịch sử**    | - [2026-06-25 14:35]: v1.3.4 Phân tích lỗi Hydration                                                                       |
| **Chi tiết**   | - Xác định lỗi sinh ra từ extension (có dấu `bis_skin_checked`). <br> - Đề xuất giải pháp tắt extension hoặc dùng ẩn danh. |
| **Ảnh hưởng**  | - Môi trường Local Development                                                                                             |
| **Ghi chú**    | Lỗi môi trường, KHÔNG PHẢI lỗi code dự án.                                                                                 |
| **Test / CI**  | ✅ Đã xác định nguyên nhân                                                                                                 |
| **Trạng thái** | ✅ Hoàn thành                                                                                                              |
