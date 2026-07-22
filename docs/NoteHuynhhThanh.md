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
- **Phân tích**: Thực tế Frontend lấy dữ liệu từ Backend qua API `/api/v1/blogs` và `/api/v1/blog-categories` để lấy danh sách bài viết chuẩn từ Database PostgreSQL. Ở local hiện tại, browser đi qua Nginx reverse proxy `http://localhost`, còn server-side Next gọi trực tiếp backend `http://localhost:3006`.
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

**Task 1: Blog Page**

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
| **Tóm tắt**    | Hoàn thành Task 1: Xóa phút đọc, format ngày thành dd/MM/yyyy                                                                                      |
| **Lịch sử**    | - [2026-06-25 09:30]: v1.1.0 Phân tích các task theo yêu cầu <br> - [2026-06-25 09:37]: v1.2.0 Hoàn thành Task 1 (Blog Page)                       |
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

| Trường         | Nội dung                                                                                                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                                                                                                                                                |
| **Module**     | `docs`                                                                                                                                                                                                                                                   |
| **Tác giả**    | HuynhhThanh                                                                                                                                                                                                                                              |
| **Tạo lúc**    | 2026-06-25 15:15 (UTC+7)                                                                                                                                                                                                                                 |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                                                                                                                                                   |
| **Loại**       | Tính năng / UI                                                                                                                                                                                                                                           |
| **Mức độ**     | L (>3 files)                                                                                                                                                                                                                                             |
| **Version**    | `v1.3.6 → v1.3.7`                                                                                                                                                                                                                                        |
| **Tóm tắt**    | Tích hợp thành công Tiptap Editor và Markdown Render                                                                                                                                                                                                     |
| **Lịch sử**    | - [2026-06-25 13:45]: v1.3.5 Dùng React Quill (Thất bại do Crash React 19) <br> - [2026-06-25 15:00]: v1.3.6 Chuyển sang Tiptap & Markdown <br> - [2026-06-25 15:15]: v1.3.7 Hoàn tất code Tiptap                                                        |
| **Chi tiết**   | - Build custom Toolbar (Lucide) cho Tiptap, tự động parse ra Markdown. <br> - Viết lại `RichContent` bằng `react-markdown` + `rehype-raw` để vừa render Markdown đẹp, vừa không làm hỏng tin tuyển dụng HTML cũ. <br> - Thêm Tailwind Typography plugin. |
| **Ảnh hưởng**  | - `web/package.json` <br> - `web/src/components/ui/RichTextEditor.tsx` <br> - `web/src/app/globals.css` <br> - `web/src/components/ui/rich-content.tsx`                                                                                                  |
| **Ghi chú**    | Dev giờ đã có thể dễ dàng đọc data trong DB.                                                                                                                                                                                                             |
| **Test / CI**  | ✅ Pass (Editor mount thành công, không Crash SSR)                                                                                                                                                                                                       |
| **Trạng thái** | ✅ Hoàn thành                                                                                                                                                                                                                                            |

---

### Task 3: Dashboard Employer - Phân tích chi tiết thuật toán "Format As You Type" Lương

- **Vấn đề cốt lõi**: Yêu cầu của khách hàng là khi gõ `100000`, UI phải hiển thị ngay `100.000` (dễ nhìn, thân thiện), nhưng giá trị lưu trữ ngầm và gửi đi (xử lý dữ liệu) phải giữ nguyên là `100000`. Tuyệt đối không cho nhập chữ.
- **Phân tích cách làm (Làm sao làm như vậy được?)**:
  Để đạt được điều này bằng **Native Code (Không dùng thư viện)**, ta phải xây dựng một component trung gian (ví dụ `CurrencyInput`) hoạt động theo nguyên lý "Controlled Component" của React, với luồng xử lý như sau:
  1. **Tách biệt UI và Data**:
     - Dữ liệu thật (Data): Lưu ở state `form.salaryMin` dưới dạng chuỗi số nguyên thuần (VD: `"100000"`).
     - Giao diện hiển thị (UI): Thẻ `<input>` nhận một giá trị đã được format (VD: `"100.000"`).
  2. **Thuật toán xử lý khi gõ (onChange)**:
     - Khi user gõ thêm 1 số, `e.target.value` sẽ trả về một chuỗi trộn lẫn (Ví dụ đang có `10.000`, gõ thêm `0` sẽ thành `10.0000`).
     - Lập tức dùng Regex `replace(/\D/g, "")` để bóc lột toàn bộ dấu chấm và chữ cái, trả nó về số nguyên thuần: `"100000"`.
     - Lưu số `"100000"` này vào state `form.salaryMin`.
     - React render lại, format `"100000"` thành `"100.000"` và đập ngược lại lên ô `<input>`.
  3. **Vấn đề IME Composition (Lỗi nhân bản chữ khi gõ tiếng Việt)**:
     - Khi cố gắng xử lý con trỏ (cursor) bằng lệnh `setSelectionRange` hoặc thay đổi `value` liên tục thành dạng có dấu chấm trong lúc bộ gõ tiếng Việt đang bật, luồng xử lý (composition state) bị cắt ngang. Điều này dẫn đến lỗi gõ `1` thành `111`.
  4. **Giải pháp thiết kế Tách biệt Input và Label (Chuẩn UX Binance/Shopee)**:
     - Để tránh mọi xung đột với bộ gõ, giải pháp tốt nhất là **không can thiệp định dạng (format) trực tiếp vào ô Input**.
     - **Thẻ Input**: Chỉ cho phép nhập số nguyên thuần tuý (VD: `1000000`). Giữ nguyên giá trị gốc `value` không bị biến đổi bởi `Intl.NumberFormat`. Dùng thuộc tính `type="tel"` để tắt IME Composition.
     - **Label hiển thị (Real-time Preview)**: Tạo ngay một dòng text nhỏ màu xanh (`text-blue-600`) ngay bên dưới ô input. Khi user gõ bên trên, dòng chữ bên dưới lập tức nhảy số định dạng `"~ 1.000.000 VNĐ"`.
     - **Đánh giá**: Cách làm này vừa đáp ứng yếu tố UI thân thiện, số tiền dễ nhìn, vừa đảm bảo tính kỹ thuật 100% bug-free (không lỗi nhảy con trỏ, không lỗi bộ gõ, không lỗi UX).
- **Các file ảnh hưởng**:
  1. `web/src/app/employer/jobs/create/page.tsx`:
     - Sửa Component `CurrencyInput` áp dụng thiết kế Binance/Shopee: Input chứa raw value, thêm một thẻ `<p>` hiển thị `displayValue` nằm ngay bên dưới.
  2. DB & BE (Không ảnh hưởng).

| Trường         | Nội dung                                                                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                                                                                                                                                                                                   |
| **Module**     | `frontend/employer/jobs`                                                                                                                                                                                                                                                                                    |
| **Tác giả**    | HuynhhThanh                                                                                                                                                                                                                                                                                                 |
| **Tạo lúc**    | 2026-06-25 17:00 (UTC+7)                                                                                                                                                                                                                                                                                    |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                                                                                                                                                                                                      |
| **Loại**       | Tính năng / UI UX                                                                                                                                                                                                                                                                                           |
| **Mức độ**     | S (1 file)                                                                                                                                                                                                                                                                                                  |
| **Version**    | `v2.1.6 → v2.1.7`                                                                                                                                                                                                                                                                                           |
| **Tóm tắt**    | Đồng bộ layout UI lưới với trang Company & Nâng cấp nhập Lương                                                                                                                                                                                                                                              |
| **Lịch sử**    | - [2026-06-25 17:00]: v2.1.4 Phân tích giải pháp Format As You Type. <br> - [2026-06-25 17:28]: v2.1.5 Phân tích lỗi IME Composition. <br> - [2026-06-25 17:41]: v2.1.6 Đổi UX sang Tách biệt Input & Label (Binance). <br> - [2026-06-25 18:25]: v2.1.7 Đồng bộ layout grid full-width giống trang Company |
| **Chi tiết**   | - Gỡ bỏ wrapper `max-w-3xl` giới hạn chiều ngang ở trang đăng tin.<br> - Sắp xếp lại form: gộp các trường dữ liệu rời rạc thành dạng cột `grid-cols-1 md:grid-cols-2`. <br> - Giúp giao diện trang tạo job đồng bộ chuẩn thiết kế UX form như bên trang Hồ sơ công ty.                                      |
| **Ảnh hưởng**  | - `web/src/app/employer/jobs/create/page.tsx`                                                                                                                                                                                                                                                               |
| **Ghi chú**    | Layout form đăng tin nay đã full width và đẹp mắt tương tự company profile.                                                                                                                                                                                                                                 |
| **Test / CI**  | ✅ Pass UI / UX hoàn hảo.                                                                                                                                                                                                                                                                                   |
| **Trạng thái** | ✅ Hoàn thành                                                                                                                                                                                                                                                                                               |

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

---

### Task 6: Dashboard Employer - Khắc phục lỗi hiển thị Sidebar (Hai menu cùng Active)

- **Vấn đề**: Trên giao diện Nhà tuyển dụng (Employer Sidebar), khi đang ở trang "Đăng tin mới" (`/employer/jobs/create`), cả hai menu "Đăng tin mới" và "Quản lý tin đăng" đều bị làm nổi bật (trạng thái active) cùng một lúc (như trong ảnh).
- **Nguyên nhân**:
  - Item "Đăng tin mới" có đường dẫn: `/employer/jobs/create`
  - Item "Quản lý tin đăng" có đường dẫn: `/employer/jobs`
  - Logic xác định active hiện tại trong file `employer-sidebar.tsx` là: `const isActive = pathname === item.href || pathname.startsWith(item.href + "/");`
  - Khi người dùng ở route `/employer/jobs/create`, đường dẫn này khớp tuyệt đối (exact match) với item "Đăng tin mới". Đồng thời nó cũng thỏa mãn điều kiện `startsWith("/employer/jobs/")` của item "Quản lý tin đăng". Dẫn đến cờ `isActive` của cả hai phần tử đều trả về `true`.
- **Cách khắc phục**:
  Sửa lại logic kiểm tra `isActive` ở phần render từng item (`navGroups.map` trong `employer-sidebar.tsx`).
  Có 2 phương án thường dùng:
  - **Phương án 1 (Thêm thuộc tính `exact`)**: Bổ sung cờ `exact: true` vào cấu hình của menu "Quản lý tin đăng". Trong logic render, nếu item có cờ `exact` thì chỉ check `pathname === item.href`.
  - **Phương án 2 (Xử lý ngoại trừ trực tiếp)**: Loại trừ trường hợp trang tạo mới khi check startsWith của trang Quản lý tin đăng.
  ```tsx
  // Ví dụ Cách 2:
  const isActive =
    pathname === item.href ||
    (pathname.startsWith(item.href + "/") &&
      !(
        item.href === "/employer/jobs" &&
        pathname.startsWith("/employer/jobs/create")
      ));
  ```

| Trường         | Nội dung                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **File**       | `docs/NoteHuynhhThanh.md`                                                                                                                                    |
| **Module**     | `frontend/layout`                                                                                                                                            |
| **Tác giả**    | HuynhhThanh                                                                                                                                                  |
| **Tạo lúc**    | 2026-06-25 19:35 (UTC+7)                                                                                                                                     |
| **Người sửa**  | AI Agent (Antigravity)                                                                                                                                       |
| **Loại**       | Sửa lỗi                                                                                                                                                      |
| **Mức độ**     | S (1 file)                                                                                                                                                   |
| **Version**    | `v1.3.5 → v1.3.6`                                                                                                                                            |
| **Tóm tắt**    | Khắc phục lỗi 2 menu sidebar cùng active khi tạo mới việc làm                                                                                                |
| **Lịch sử**    | - [2026-06-25 19:35]: v1.3.5 Phân tích nguyên nhân lỗi logic path ở Employer Sidebar. <br> - [2026-06-25 19:49]: v1.3.6 Áp dụng code sửa lỗi sidebar         |
| **Chi tiết**   | - Cập nhật logic `isActive`, thêm điều kiện loại trừ nhánh route `/employer/jobs/create` khi duyệt thẻ Quản lý tin đăng, tránh xung đột exact và startsWith. |
| **Ảnh hưởng**  | - `web/src/components/layout/employer-sidebar.tsx`                                                                                                           |
| **Ghi chú**    | (Không)                                                                                                                                                      |
| **Test / CI**  | ✅ Chạy ổn định trên giao diện                                                                                                                               |
| **Trạng thái** | ✅ Hoàn thành                                                                                                                                                |

---

### 8. Khắc phục lỗi Hydration (React Hydration Error)

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

---E DỰ ÁN**. Nguyên nhân là do một **Browser Extension** (tiện ích mở rộng của trình duyệt) trên máy bạn đã tự động thay đổi cấu trúc HTML (DOM) ngay trước khi React kịp thực hiện quá trình Hydration. Dấu hiệu `bis_skin_checked` đặc trưng xuất phát từ các extension bảo mật/tải file như **Bitdefender (Anti-tracker/Wallet)**, **Internet Download Manager (IDM)**, hoặc trình quản lý mật khẩu.
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

---
