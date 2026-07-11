# FE Folder Structure Guide

> Tài liệu hướng dẫn đặt code Frontend cho PQJobs. Mục tiêu là giúp team FE biết file mới nên nằm ở đâu, tránh nhồi logic domain vào `app/`, `components/` hoặc `lib/` sai vai trò.
>
> Cập nhật: 11/07/2026

---

## 1. Nguyên tắc nhanh

- `app/` chỉ là route boundary của Next.js: page, layout, loading/error/not-found và API proxy/BFF.
- `features/<domain>/` chứa logic nghiệp vụ theo domain: API client theo feature, hook, type, utils, component nội bộ của feature.
- `components/ui/` chỉ chứa UI primitive kiểu shadcn/base component, không chứa rule nghiệp vụ.
- `components/common/`, `components/layout/`, `components/media/` chứa component dùng lại nhiều domain.
- `lib/` chỉ chứa core shared thật sự, không thêm query/hook/domain business mới vào đây.
- `hooks/` chỉ chứa hook UI/global nhỏ. Hook nghiệp vụ đặt trong `features/<domain>/hooks`.
- `types/` chỉ chứa type shared xuyên app. Type riêng của feature đặt trong `features/<domain>/types.ts`.

---

## 2. Cây quyết định khi thêm file mới

1. File này có tạo URL/route mới không?
   - Có: đặt trong `web/src/app/...`.
   - Không: đi tiếp.

2. File này gắn với một nghiệp vụ cụ thể không?
   - Có: đặt trong `web/src/features/<domain>/...`.
   - Ví dụ: quản lý tin đăng -> `features/employer-jobs`; ứng viên employer -> `features/employer-applications`; notification -> `features/notifications`.

3. File này là UI primitive không biết gì về nghiệp vụ không?
   - Có: đặt trong `web/src/components/ui`.
   - Ví dụ: `button`, `dialog`, `tabs`, `input`, `table`.

4. File này là component dùng lại nhiều domain không?
   - Có: đặt trong `components/common`, `components/layout`, `components/media` hoặc thư mục shared phù hợp.
   - Ví dụ: crop ảnh dùng cho avatar/logo/cover -> `components/media`.

5. File này là helper core không phụ thuộc domain không?
   - Có: đặt trong `web/src/lib`.
   - Ví dụ: `api-client`, auth helper, `cn`, format ngày/tiền dùng rộng.

6. Nếu chỉ dùng cho một màn hình lớn:
   - Ưu tiên tách vào `features/<domain>/components` hoặc `features/<domain>/hooks`, rồi page trong `app/` chỉ compose.

---

## 3. Vai trò từng thư mục hiện tại

### `web/src/app`

Chứa Next.js App Router:

- `app/(main)`: route public như home, jobs, companies, blog, contact.
- `app/auth`: login/register/OTP/reset/select-role/callback.
- `app/candidate`: dashboard và workspace candidate.
- `app/employer`: dashboard và workspace employer.
- `app/blog`: tạo/sửa bài blog.
- `app/quota`: checkout nâng gói quota.
- `app/api`: BFF/proxy route tới backend, auth, CopilotKit, AI agent.

Rule:

- Page/layout được phép fetch/compose UI, nhưng không nên chứa formatter, parser, business rule dài.
- Nếu page vượt dài hoặc có nhiều state/action, tách sang `features/<domain>`.
- API route trong `app/api` chỉ proxy/orchestrate mỏng, không chứa business logic thay backend.

### `web/src/features`

Đây là nơi đặt code nghiệp vụ theo domain. Một feature có thể có:

```txt
features/<domain>/
  api.ts
  types.ts
  utils.ts
  constants.ts
  hooks/
  components/
```

Các feature hiện có:

- `applications`: hook/chat liên quan application.
- `auth-register`: flow đăng ký nhiều bước.
- `blog-detail`, `blog-management`: đọc, tạo, sửa, quản lý blog.
- `candidate-profile`: API/type cho profile candidate.
- `dashboard`: TanStack Query cho dashboard summary.
- `employer-applications`: quản lý ứng viên, applicant card, utils hiển thị CV/application.
- `employer-company`: hồ sơ công ty, logo/cover/company form.
- `employer-dashboard`: type/utils riêng dashboard employer.
- `employer-jobs`: quản lý tin đăng, create/edit/checkout helper.
- `job-detail`, `jobs-search`: public job detail/search flow.
- `notifications`: query, mutation, href/icon mapping notification.
- `realtime`: Socket.IO provider/hook cập nhật cache realtime.
- `saved-companies`, `saved-jobs`: API cho danh sách đã lưu/theo dõi.
- `seo`: structured data/JSON-LD helper.

Rule:

- Query/hook domain mới đặt ở đây, không đặt vào `lib`.
- Type domain dùng trong feature đặt trong `types.ts` của feature.
- Component chỉ dùng cho feature đặt trong `features/<domain>/components`.

### `web/src/components`

Chứa component UI dùng lại hoặc component lịch sử đang tồn tại.

- `components/ui`: primitive UI, không chứa nghiệp vụ.
- `components/common`: component shared như Header, Footer, card/search chung.
- `components/layout`: sidebar/layout shell candidate/employer.
- `components/media`: xử lý media dùng chung, ví dụ crop ảnh.
- `components/quota`: UI quota dùng nhiều dashboard/flow.
- `components/applications`: component chat application dùng chung candidate/employer.
- `components/blog`, `components/jobs`, `components/dashboard`, `components/company`, `components/candidate/profile`: nhóm component domain đã tồn tại từ trước.

Rule:

- Không cần dời toàn bộ component cũ ngay.
- Với code mới, nếu component gắn chặt một domain, ưu tiên đặt trong `features/<domain>/components`.
- Chỉ đưa vào `components/common` khi component thật sự dùng lại nhiều domain.

### `web/src/lib`

Chỉ chứa core shared:

- `api-client.ts`: HTTP client, unwrap response, `ApiError`.
- `auth.ts`, `auth-client.ts`, `server-auth.ts`: auth helper/client/server helper.
- `html-safety.ts`: sanitize/safety helper.
- `utils.ts`: `cn`.
- `utils/date.ts`, `utils/format.ts`: helper ngày/format dùng rộng.
- `profile-completion.ts`, `resume-pdf.ts`, `resume-template-data.ts`: hiện còn là shared helper cho CV/profile, chưa dời trong lượt này.

Rule:

- Không thêm `dashboard-queries`, `notification-queries`, `job-api`, `company-api` vào `lib`.
- Nếu helper chỉ phục vụ một domain, đặt vào feature tương ứng.
- Nếu helper bắt đầu phình to theo nghiệp vụ, tách khỏi `lib` về `features/*`.

### `web/src/hooks`

Chứa hook global/UI nhỏ:

- `use-mobile`
- `use-theme`
- `useScrollAnimation`
- `use-resume-editor`
- `use-template-renderer`

Rule:

- Hook nghiệp vụ mới đặt trong `features/<domain>/hooks`.
- Hook ở đây không nên gọi API nghiệp vụ cụ thể trừ legacy đã có.

### `web/src/types`

Chứa type shared xuyên app như `blog`, `company`, `job`, `resume`.

Rule:

- Type chỉ dùng trong một feature đặt trong `features/<domain>/types.ts`.
- Type API response riêng của feature không đặt vào `types/` nếu không dùng rộng.

### `web/src/template`

Chỉ dành cho CV/resume template và renderer liên quan template.

---

## 4. Ví dụ đặt file đúng

| Nhu cầu | Nơi đặt khuyến nghị |
|---------|---------------------|
| Thêm filter quản lý ứng viên employer | `features/employer-applications` |
| Thêm nút/action cho tin đăng employer | `features/employer-jobs` hoặc component con dưới feature đó |
| Thêm API upload cover công ty phía FE | `features/employer-company/api.ts` |
| Thêm component crop ảnh dùng cho avatar/logo/cover | `components/media` |
| Thêm notification mutation/read-all | `features/notifications/queries.ts` |
| Thêm Socket.IO listener cho cache dashboard | `features/realtime` |
| Thêm JSON-LD cho public SEO | `features/seo` |
| Thêm primitive `Stepper` không có nghiệp vụ | `components/ui/stepper.tsx` |
| Thêm formatter chỉ dùng trong job card | `features/jobs-search` hoặc `components/jobs` nếu đang chỉnh component legacy |

---

## 5. Những ngoại lệ/legacy cần biết

- `components/blog`, `components/jobs`, `components/dashboard`, `components/candidate/profile` vẫn tồn tại và đang được dùng.
- Không refactor dồn các thư mục này chỉ để “đẹp cây”. Khi sửa lớn một flow, có thể tách dần sang `features/<domain>`.
- `lib/profile-completion.ts`, `lib/resume-pdf.ts`, `lib/resume-template-data.ts` hiện còn giữ vì liên quan CV/profile nhiều nơi. Nếu refactor sau, cần kiểm tra kỹ print/export/template.
- `app/api/*` là BFF/proxy của Next.js, không thay thế backend NestJS.

---

## 6. Checklist trước khi tạo file mới

- File có nằm đúng domain chưa?
- Có đang thêm query/hook nghiệp vụ vào `lib` không?
- Component có thật sự shared không, hay chỉ dùng cho một page?
- Page trong `app/` có đang quá dài và cần tách sang feature không?
- Type này có dùng xuyên app không, hay chỉ nên nằm trong feature?
- Nếu đụng realtime/notification/dashboard cache, đã dùng `features/realtime` và `features/notifications` chưa?
