# Changelog — Branch `feature/improve-company-page`

PR: #16 — Redesign candidate dashboard và đồng bộ follow company

## Tổng quan
Cải tiến trang danh sách công ty, trang chi tiết công ty, dark mode toàn diện, redesign hoàn chỉnh Dashboard Candidate theo bản thiết kế mới, và đồng bộ tính năng "Theo dõi công ty" với database.

## ⚠️ Lưu ý quan trọng cho nhóm trưởng
- Database của mỗi người là **local riêng** (không chung server). Thay đổi trong `seed.ts` chỉ ảnh hưởng database của bạn **nếu bạn tự chạy** `npx prisma migrate reset` hoặc `npx prisma db seed`. Pull code về không tự động đổi database hiện tại của bạn.
- Không có migration mới — không sửa `schema.prisma`.

---

## 1. Backend — Module `companies`

**File: `backend/src/modules/companies/companies.service.ts`**
- Hàm `findAll()`: thêm `_count: { select: { jobs: true } }` vào Prisma `include`.
  - **Lý do:** API trước đó không trả về số lượng job của mỗi công ty, khiến frontend luôn hiển thị "0 vị trí" dù công ty có job đang active.
  - **Ảnh hưởng:** response của `GET /api/v1/companies` giờ có thêm field `_count.jobs` ở mỗi item. Không đổi logic nghiệp vụ, không cần migration.

---

## 2. Database — Seed data

**File: `backend/prisma/seed.ts`**
- Mở rộng dữ liệu mẫu từ **8 → 100 công ty** (thêm `company_009` đến `company_100`), với industry/size đa dạng (cycle qua 8 ngành nghề, 4 mức quy mô).
- Mở rộng employer test users từ **8 → 100** (`cuid_employer_002` đến `cuid_employer_100`) để làm `ownerId` cho các công ty mới.
- **Mục đích:** có đủ dữ liệu để test phân trang, bộ lọc ngành nghề, và sắp xếp với số lượng lớn.
- **Cách áp dụng (tùy chọn, không bắt buộc):**
  ```bash
  cd backend
  npx prisma migrate reset --force
  npx prisma db seed
  ```

⚠️ **Vấn đề tồn đọng:** tài khoản test `candidate@phuquoc.jobs` hiện bị lỗi `Credential account not found` khi đăng nhập — seed tạo `user` nhưng không tạo kèm `account` (bảng lưu password credential). Cần bổ sung logic tạo `account` cho các user test trong `seed.ts` nếu muốn đăng nhập được bằng các tài khoản này.

---

## 3. Frontend — Trang danh sách Công ty (`/companies`)

**File: `web/src/app/companies/page.tsx`**
- Thêm hàm `fetchJobsCount()` gọi `GET /api/v1/jobs?limit=1` để lấy tổng số việc làm toàn hệ thống.
- Truyền thêm prop `totalJobs` xuống `CompaniesPageClient`.

**File: `web/src/app/companies/CompaniesPageClient.tsx`**
- **Industry tabs động:** thay hardcode bằng danh sách tính từ dữ liệu thật (`useMemo` trên `initialCompanies`).
- **Bộ lọc sắp xếp:** thêm dropdown "Nổi bật nhất / Nhiều việc làm nhất / Tên A-Z" với logic sort tương ứng.
- **Stats bar:** hiển thị tổng số công ty và tổng số việc làm bằng số liệu thật (không hardcode).
- **Fix bug pagination:** giới hạn cứng tối đa 5 nút trang trước đó → sửa hiển thị đủ số trang theo `totalPages` thực tế.
- **Fix bug filter:** khi đổi industry tab, trang hiện tại không reset về 1, khiến danh sách hiển thị rỗng nếu trang cũ vượt quá số trang mới — đã thêm `setCurrentPage(1)` vào handler `onClick` của tab.
- **Fix bug animation:** `useEffect` của `IntersectionObserver` (animation fade-up cho card) thiếu dependency `searchText` và `sortBy`, khiến card bị ẩn sau khi search hoặc đổi sắp xếp — đã bổ sung đầy đủ dependency array.
- **Fix UI:** đường viền mờ (anti-aliasing) giữa hero section và phần nội dung do SVG wave — sửa bằng `transform: translateY(1px)` + `display: block` trên SVG.
- **Dark mode:** thêm đầy đủ class `dark:` cho toàn bộ trang (background, border, text, các thành phần search box/tabs/sort bar/pagination/CTA).
- **Tối ưu performance:** fetch `GET /api/v1/saved/companies` **1 lần duy nhất** cho toàn trang (trước đó mỗi `CompanyCard` tự fetch riêng → tốn N request không cần thiết khi hiển thị 100 card). Kết quả cache vào `sessionStorage`, truyền `isFollowed` prop xuống từng card.

**File: `web/src/components/company/CompanyCard.tsx`**
- Thêm dark mode cho card công ty: nền, viền, tên công ty, text ngành nghề/địa chỉ, nút "+ Theo dõi".
- **Kết nối nút "+ Theo dõi" với API thật:** `POST /api/v1/saved/companies/:companyId` (trước đó chỉ đổi state local trong component, không lưu DB — bấm theo dõi xong load lại trang là mất).
- Nhận prop `isFollowed` từ component cha, sync qua `useEffect` để không bị reset trạng thái khi navigate sang trang khác rồi quay lại.
- Cập nhật `sessionStorage` mỗi khi toggle để giữ trạng thái xuyên suốt session, tránh phải gọi lại API liên tục.
- **Thêm check đăng nhập:** nếu user chưa đăng nhập, bấm "+ Theo dõi" sẽ chuyển hướng sang `/auth/login?redirect=...` thay vì gọi API và nhận lỗi 401 âm thầm.

**File: `web/src/app/companies/[slug]/CompanyDetailClient.tsx`**
- Thêm dark mode đầy đủ cho trang chi tiết công ty: hero section, logo box, stats cards, tabs, nội dung tab (overview/jobs/reviews), sidebar thông tin công ty.
- **Kết nối nút "+ Theo dõi" với API thật:** check trạng thái ban đầu khi load trang (`GET /saved/companies`), toggle qua `POST /saved/companies/:id`.
- Thêm check đăng nhập tương tự `CompanyCard.tsx`.

**File: `web/src/components/common/Footer.tsx`**
- Thêm dark mode cho footer, dùng bảng màu đúng theo bản thiết kế tham chiếu: nền `#091A27`/`#0C2231`, viền `#1E5F74`, text phụ `#94A3B8`, text nổi bật/hover `#67E8F9`.

**File: `web/src/app/globals.css`**
- Thêm utility class `.scrollbar-hide` (ẩn scrollbar ngang ở thanh industry tabs, hỗ trợ cả Webkit và Firefox).

---

## 4. Merge với `main`

- Đã pull code mới nhất từ `main` và merge vào branch hiện tại.
- Xử lý 2 conflict:
  - **`companies.service.ts`:** giữ bản `main` — constructor dùng `AuditWriteContractService` (thay `AuditService` cũ).
  - **`web/src/components/common/Header.tsx`:** giữ bản `main` — logic lấy notifications qua `useAuth()` context (thay fetch `/api/v1/auth/me` thủ công).

---

## 5. Frontend — Candidate Dashboard (đã hoàn thành)

**File: `web/src/components/common/Header.tsx`**
- Đồng bộ navbar dùng chung cho toàn site (public pages + candidate dashboard) — fix lỗi navbar bị "nhảy" (đổi component) khi chuyển trang, vì trước đó có 2 navbar riêng biệt.
- Thêm border cố định phân biệt rõ navbar với sidebar.
- Ẩn tên người dùng trên navbar, chỉ giữ avatar (theo yêu cầu UI gọn hơn).

**File: `web/src/app/candidate/layout.tsx`**
- Đổi từ `Navbar` riêng sang dùng chung `Header.tsx`.
- Thêm `lg:ml-72 px-4 md:px-8 py-8` cho `<main>` để nội dung không bị sidebar che.

**File: `web/src/app/layout.tsx`**
- Thêm font Material Symbols Outlined cho toàn site (dùng cho icon trong toàn bộ dashboard).

**File: `web/src/app/candidate/dashboard/page.tsx`**
- Bỏ Tabs "Tổng quan / AI Co-worker" không cần thiết — chuyển sang layout thẳng theo thiết kế mới.
- Fix bug: header "Xin chào" bị sidebar che mất phần đầu.
- Fetch `GET /api/v1/saved/companies` để lấy số công ty theo dõi thật, truyền xuống `StatsCards`.
- Fix bug hiển thị "undefined CV" ở stat card cuối.
- Icon thông báo hiển thị theo loại (accepted/rejected/deadline/system) với màu sắc tương ứng.

**File: `web/src/components/dashboard/stats-cards.tsx`**
- Card "Công ty theo dõi": đổi từ hardcode `value: 3` sang nhận prop `savedCompaniesCount` lấy số liệu thật từ API. *(Hoàn tất — mục này trước đó còn đang làm, giờ đã xong.)*

**File: `web/src/components/dashboard/recent-applications.tsx`**
- Cập nhật đồng bộ theo thay đổi chung của dashboard (style, dark mode).

**File: `web/src/components/layout/candidate-sidebar.tsx`**
- Viết lại hoàn toàn: thêm dropdown thông báo (icon riêng theo loại, badge số chưa đọc) và dropdown avatar người dùng — *(phần này ban đầu nằm ở `navbar.tsx`, sau đó được gộp vào `Header.tsx` dùng chung)*.
- Tăng width `w-64` → `w-72` để chứa đủ label + badge không bị xuống dòng xấu.
- Sửa link "Công ty theo dõi" → `/candidate/saved-companies` (trang mới, xem mục 6).
- Bỏ badge số dư thừa ở "Việc làm đã lưu" và "Công ty theo dõi" (giữ badge có ý nghĩa ở "Đơn ứng tuyển" và "Thông báo").
- Thêm xóa `sessionStorage` (key `savedCompanyIds`) khi logout, để tránh hiển thị sai trạng thái "đang theo dõi" cho người dùng khác đăng nhập sau đó trên cùng máy/trình duyệt.

**File: `web/src/components/layout/navbar.tsx`**
- File cũ ban đầu được sửa thêm dropdown thông báo + avatar, sau đó toàn bộ candidate layout chuyển sang dùng chung `Header.tsx` nên file này không còn được sử dụng trực tiếp cho candidate nữa, vẫn giữ trong codebase.

---

## 6. Mới hoàn toàn — Trang Công ty theo dõi

**File: `web/src/app/candidate/saved-companies/page.tsx`** *(file mới)*

Trang "Công ty theo dõi" xây mới theo thiết kế:
- Stat cards: Đang theo dõi / Việc đang tuyển / Ngành nghề / Đang tuyển gấp.
- Tìm kiếm theo tên/ngành, filter theo ngành nghề, sắp xếp (mới nhất / nhiều việc / A-Z).
- Card công ty: cover gradient, logo, badge "Đang theo dõi", thanh tỉ lệ việc đang tuyển.
- Nút "Bỏ theo dõi" gọi `POST /api/v1/saved/companies/:id` (toggle) + cập nhật `sessionStorage`.
- Empty state khi chưa theo dõi công ty nào.
- Grid responsive, tối đa 4 cột trên màn hình lớn.

---

## 7. Backend — file khác có thay đổi

**File: `backend/src/modules/applications/applications.service.ts`**
- Cập nhật đồng bộ theo thay đổi chung của dashboard (định dạng response cho phần "Đơn ứng tuyển gần đây").

---

## 8. Vấn đề tồn đọng (cần nhóm trưởng lưu ý)

- Tài khoản test `candidate@phuquoc.jobs` bị lỗi **"Credential account not found"** khi đăng nhập (xem mục 2).
- Employer Dashboard — chưa bắt đầu, đang chờ thiết kế từ nhóm trưởng.
- Chưa kiểm tra Employer Sidebar có cần đồng bộ xóa `sessionStorage` khi logout tương tự Candidate Sidebar hay không.
- Nút chia sẻ ở trang chi tiết công ty — mới nêu ý tưởng, chưa code.

---

## Trạng thái commit/push

| Phần | Trạng thái |
|---|---|
| Mục 1–4 (trang Công ty, dark mode, seed data, merge) | ✅ Đã commit & push lên `feature/improve-company-page` |
| Mục 5–7 (Dashboard Candidate, trang Saved Companies) | ✅ Đã commit & push (commit `51efc16`) |
| Mục 8 (vấn đề tồn đọng) | ❌ Chưa xử lý, cần thảo luận thêm |