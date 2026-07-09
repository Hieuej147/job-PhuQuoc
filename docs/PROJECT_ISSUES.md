# Phú Quốc Jobs — Project Issues Report

*Last updated: 2026-06-09*
*Tổng hợp bugs từ FE browser test + BE code audit*

---

## Tổng quan

| Severity | FE | BE | Tổng |
|----------|----|----|------|
| Critical | 5 | 4 | 9 |
| High/Significant | 9 | 6 | 15 |
| Medium/Moderate | 17 | 14 | 31 |
| Low/Minor | 7 | 16 | 23 |
| **Tổng** | **38** | **40** | **78** |

---

# PHẦN 1: FRONTEND ISSUES

---

## Auth Module

### FE-AUTH-01 🔴 Critical — Login page crash khi gõ email

- **File**: `web/src/app/auth/login/page.tsx` dòng 132, 151
- **Mô tả**: `setError("")` được gọi trong `onChange` handler nhưng `setError` không tồn tại trong component. Chỉ có `setEmailErr` và `setPassErr`.
- **Tác dụng**: Khi user gõ email/password → `ReferenceError: setError is not defined` → page crash
- **Fix**:
```tsx
// XÓA setError("") khỏi onChange handlers
onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}  // bỏ setError("")
onChange={(e) => { setPassword(e.target.value); setPassErr(""); }}  // bỏ setError("")
```

### FE-AUTH-02 🔴 Critical — Employer registration flow broken

- **File**: `web/src/app/auth/register/page.tsx` dòng 61
- **Mô tả**: `goNext` function: `setStep(role === "EMPLOYER" ? 3 : 3)` — cả 2 nhánh đều đi step 3. Step 3 chỉ hiển thị form password, không có form company info cho EMPLOYER. Step 4 (password thực) không bao giờ đạt được.
- **Tác dụng**: Employer không thể đăng ký — flow bị kẹt ở step 3
- **Fix**: Thêm form company info cho EMPLOYER step 3, step 4 là password

### FE-AUTH-03 🟡 Moderate — Register step logic confusion

- **File**: `web/src/app/auth/register/page.tsx` dòng 61
- **Mô tả**: `setStep(role === "EMPLOYER" ? 3 : 3)` — ternary vô nghĩa, cả 2 đều về 3
- **Fix**: Implement đúng step flow cho EMPLOYER

---

## Homepage

### FE-HOME-01 🔴 Critical — JobCard link đến 404

- **File**: `web/src/components/candidate/JobCard.tsx` dòng 39
- **Mô tả**: Link `href` là `/candidate/${job.categorySlug}/${job.slug}` — route này không tồn tại. Route đúng là `/jobs/${job.slug}`
- **Tác dụng**: Mọi job card trên homepage link đến 404
- **Fix**:
```tsx
href={`/jobs/${job.slug}`}
```

### FE-HOME-02 🟡 Moderate — SearchBar không hoạt động

- **File**: `web/src/components/candidate/SearchBar.tsx` dòng 146-149
- **Mô tả**: Button "Tìm kiếm" không có `onClick` handler. Keyword và location state được quản lý nhưng không dùng để navigate hay search
- **Tác dụng**: SearchBar trên homepage hoàn toàn vô dụng
- **Fix**: Thêm onClick navigate đến `/jobs?search=${keyword}&location=${location}`

### FE-HOME-03 🟡 Moderate — Không có empty state cho categories/jobs/blogs

- **File**: `web/src/app/HomePageClient.tsx` dòng 119-190
- **Mô tả**: Nếu API trả về array rỗng, sections render grid trống không có thông báo
- **Fix**: Thêm empty state "Chưa có dữ liệu" cho mỗi section

---

## Jobs Module

### FE-JOBS-01 🔴 Critical — Companies CTA link đến `/register` sai

- **File**: `web/src/app/companies/CompaniesPageClient.tsx` dòng 145
- **Mô tả**: Button "Đăng ký công ty" link đến `/register` nhưng route đúng là `/auth/register`
- **Tác dụng**: Click CTA → 404
- **Fix**: `href="/auth/register"`

### FE-JOBS-02 🟡 Moderate — Filters chỉ work single select

- **File**: `web/src/app/jobs/JobsPageClient.tsx` dòng 130-145
- **Mô tả**: Filter logic chỉ gửi API params khi `length === 1`. Nếu chọn 2+ items → filter bị bỏ qua
- **Fix**: Hỗ trợ multi-value API params hoặc enforce single-selection trong UI

### FE-JOBS-03 🟡 Moderate — Salary/location filters không hoạt động

- **File**: `web/src/app/jobs/JobsPageClient.tsx` dòng 123-159
- **Mô tả**: `salaryRanges` và `location` filters được track trong state nhưng không gửi làm API params
- **Fix**: Thêm salary range mapping và location handling vào fetchJobs

### FE-JOBS-04 🟡 Moderate — Filter level names mismatch

- **File**: `web/src/components/jobs/JobFilter.tsx` dòng 49-56 vs `JobsPageClient.tsx` dòng 138-141
- **Mô tả**: Filter sidebar dùng tiếng Việt ("Nhân viên", "Chuyên viên") nhưng API mapping dùng tiếng Anh ("Junior", "Middle"). Level filter không bao giờ match
- **Fix**: Align filter labels với API mapping values

### FE-JOBS-05 🟡 Moderate — Double fetch on initial load

- **File**: `web/src/app/jobs/JobsPageClient.tsx` dòng 162-164
- **Mô tả**: `useEffect` trigger `fetchJobs` ngay khi mount, nhưng component đã nhận `initialJobs` từ server → fetch thừa
- **Fix**: Skip initial fetch nếu `page === 1` và filters mặc định

---

## Companies Module

### FE-COM-01 🟡 Moderate — Website link bị double protocol

- **File**: `web/src/app/companies/[slug]/CompanyDetailClient.tsx` dòng 206
- **Mô tả**: `href={`https://${info.value}`}` — nếu company đã lưu URL với `https://` → kết quả là `https://https://example.com`
- **Fix**: Check nếu value đã bắt đầu bằng `http` trước khi prepend

### FE-COM-02 🟡 Moderate — "Công ty tương tự" placeholder

- **File**: `web/src/app/companies/[slug]/CompanyDetailClient.tsx` dòng 215-218
- **Mô tả**: Section "Công ty tương tự" chỉ hiển thị "Sẽ sớm cập nhật" placeholder
- **Fix**: Implement fetch companies cùng ngành

### FE-COM-03 🟡 Moderate — "Đánh giá" tab placeholder

- **File**: `web/src/app/companies/[slug]/CompanyDetailClient.tsx` dòng 182-187
- **Mô tả**: Tab đánh giá hiển thị placeholder, feature chưa implement
- **Fix**: Implement hoặc xóa tab

---

## Blog Module

### FE-BLOG-01 🟡 Moderate — Sort "cũ nhất" dùng ID thay vì date

- **File**: `web/src/components/blog/BlogPageClient.tsx` dòng 94-97
- **Mô tả**: Sort "Cũ nhất" dùng `a.id.localeCompare(b.id)` thay vì so sánh date. Nếu ID là UUID → sort random
- **Fix**: Sort bằng `new Date(a.date).getTime() - new Date(b.date).getTime()`

### FE-BLOG-02 🟡 Moderate — Related blogs ignore categoryId

- **File**: `web/src/app/blog/[slug]/page.tsx` dòng 27-33
- **Mô tả**: `fetchRelatedBlogs(categoryId, currentId)` nhận param `categoryId` nhưng không dùng trong fetch URL. Fetch tất cả blogs
- **Fix**: Thêm `categoryId` vào fetch URL

### FE-BLOG-03 🟡 Moderate — Newsletter signup không hoạt động

- **File**: `web/src/components/blog/BlogPageClient.tsx` dòng 407-416
- **Mô tả**: Button "Đăng ký ngay" không có onClick handler
- **Fix**: Thêm handler gọi newsletter subscription API

---

## Candidate Dashboard

### FE-DASH-01 🟡 Moderate — `jobType` vs `type` field name

- **File**: `web/src/app/candidate/dashboard/page.tsx` dòng 175
- **Mô tả**: Saved jobs section dùng `job?.jobType` nhưng API trả về `type`. Badge luôn hiển thị rỗng
- **Fix**: Đổi thành `job?.type`

### FE-DASH-02 🟡 Moderate — Không handle API errors

- **File**: `web/src/app/candidate/dashboard/page.tsx` dòng 44-59
- **Mô tả**: `errors` array được populate nhưng không bao giờ push error messages. `if (errors.length > 0)` luôn false
- **Fix**: Thêm error pushing trong else branches

---

## Employer Dashboard

### FE-EMP-01 🟡 Moderate — Debug string leak

- **File**: `web/src/app/employer/dashboard/page.tsx` dòng 480
- **Mô tả**: Hiển thị `jobs.level: {job.level}` thay vì chỉ `{job.level}`
- **Fix**: Xóa prefix "jobs.level: "

### FE-EMP-02 🟡 Moderate — Hardcoded fake data

- **File**: `web/src/app/employer/dashboard/page.tsx` dòng 309-599
- **Mô tả**: Stat cards hiển thị hardcoded "+1 mới", "12 mới", "47", "12" khi data thực = 0
- **Fix**: Xóa tất cả hardcoded fallback numbers

### FE-EMP-03 🟡 Moderate — Duyệt/Từ chối buttons không có handler

- **File**: `web/src/app/employer/dashboard/page.tsx` dòng 575-581
- **Mô tả**: Buttons "Duyệt" và "Từ chối" trên REVIEWING applicants không có onClick handlers
- **Fix**: Thêm handlers gọi application status API

### FE-EMP-04 🟡 Moderate — Job edit link đến trang không tồn tại

- **File**: `web/src/app/employer/dashboard/page.tsx` dòng 509
- **Mô tả**: Link `/employer/jobs/${job.id}/edit` — không có page edit
- **Fix**: Tạo edit page hoặc redirect đến create page

### FE-EMP-05 🟡 Moderate — Job close/delete/reopen buttons không có handler

- **File**: `web/src/app/employer/dashboard/page.tsx` dòng 513-515
- **Mô tả**: Buttons "Đóng", "Xóa", "Đăng lại" không có onClick handlers
- **Fix**: Thêm handlers

### FE-EMP-06 🟡 Moderate — Employer company page không có error/success feedback

- **File**: `web/src/app/employer/company/page.tsx` dòng 46-77
- **Mô tả**: `handleSave` có empty catch blocks, không có success toast
- **Fix**: Thêm error handling và toast notifications

### FE-EMP-07 🟡 Moderate — Employer jobs hiển thị raw enum

- **File**: `web/src/app/employer/jobs/page.tsx` dòng 79
- **Mô tả**: Hiển thị `FULL_TIME` thay vì `Full-time`
- **Fix**: Áp dụng type label mapping

### FE-EMP-08 🟡 Moderate — Job edit link đến trang không tồn tại

- **File**: `web/src/app/employer/jobs/page.tsx` dòng 85
- **Mô tả**: Link `/employer/jobs/create?edit=${job.id}` — create page không handle edit query
- **Fix**: Tạo edit page hoặc implement edit mode

---

## Job Detail / Apply

### FE-APPLY-01 🟢 Significant — Upload tab không gửi file

- **File**: `web/src/app/jobs/[slug]/JobDetailClient.tsx` dòng 355-376, 241-267
- **Mô tả**: Apply modal có "Upload PDF" tab nhưng `handleApply` chỉ gửi `resumeId`, không gửi uploaded file
- **Fix**: Thêm FormData handling khi `applyTab === "upload"`

### FE-APPLY-02 🟡 Moderate — Upload tab submit empty application

- **File**: `web/src/app/jobs/[slug]/JobDetailClient.tsx` dòng 393
- **Mô tả**: Submit button chỉ disabled khi `applyTab === "select" && resumes.length === 0`. Upload tab không check file
- **Fix**: Thêm disable khi `applyTab === "upload" && !uploadedFile`

---

## Payment

### FE-PAY-01 🟢 Minor — Payment success fragile code

- **File**: `web/src/app/payment/success/page.tsx` dòng 29-36
- **Mô tả**: `res.json()` gọi 2 lần trên branches mutually exclusive — fragile pattern
- **Fix**: Restructure error handling

---

## CopilotKit / AI

### FE-AI-01 🟡 Moderate — Agent URL port mismatch

- **File**: `web/src/app/api/copilotkit/[[...slug]]/route.ts` dòng 7
- **Mô tả**: Default agent URL là `http://localhost:8125` nhưng docs nói port `8123`
- **Fix**: Align port numbers

### FE-AI-02 🟢 Minor — CopilotKit v2 imports có thể không tồn tại

- **Files**: Nhiều files import từ `@copilotkit/react-core/v2`
- **Mô tả**: Nếu version CopilotKit không export từ `/v2` path → build fail
- **Fix**: Verify imports against installed version

---

## Error Handling (chung)

### FE-ERR-01 🟢 Minor — Nhiều pages không có error state

- **Files**: `candidate/saved/page.tsx`, `candidate/applications/page.tsx`, `employer/applications/page.tsx`, `employer/jobs/page.tsx`
- **Mô tả**: Empty `catch(() => {})` blocks — API fail → user thấy list trống không có error message
- **Fix**: Thêm error state và display

### FE-ERR-02 🟢 Minor — Candidate profile không có error handling

- **File**: `web/src/app/candidate/profile/page.tsx` dòng 28-37
- **Mô tả**: `handleSave` không check response.ok, không có error handling hay success feedback
- **Fix**: Thêm response checking và toast

---

## Hooks

### FE-HOOK-01 🟢 Minor — useScrollAnimation memory leak

- **File**: `web/src/hooks/useScrollAnimation.ts` dòng 6-33
- **Mô tả**: Observer cleanup chỉ trong setTimeout callback, không phải trong useEffect cleanup
- **Fix**: Store observer reference và disconnect trong outer cleanup

---

# PHẦN 2: BACKEND ISSUES

---

## Auth Module

### BE-AUTH-01 🔴 Critical — Admin role escalation qua registration

- **File**: `backend/src/auth/auth.ts` dòng 118-136
- **Mô tả**: `databaseHooks.user.create.before` chỉ set role nếu trong `["CANDIDATE", "EMPLOYER"]`. Nếu user gửi `role: "ADMIN"` → hook không strip → user tạo với role ADMIN
- **Fix**:
```typescript
// Strip role nếu không phải CANDIDATE/EMPLOYER
if (body.role && !["CANDIDATE", "EMPLOYER"].includes(body.role)) {
  delete body.role;
}
```

### BE-AUTH-02 🟡 Medium — User self-promotion qua PATCH /me

- **File**: `backend/src/auth/auth.service.ts` dòng 33-48, `dto/update-profile.dto.ts` dòng 16-18
- **Mô tả**: CANDIDATE có thể đổi role thành EMPLOYER (và ngược lại) qua `PATCH /api/v1/auth/me`
- **Fix**: Chỉ ADMIN mới được đổi role, hoặc xóa `role` khỏi UpdateProfileDto

### BE-AUTH-03 🟡 Medium — Auth getProfile trả về null thay vì 404

- **File**: `backend/src/auth/auth.service.ts` dòng 26-28
- **Mô tả**: `getProfile()` trả về `null` khi user không tìm thấy → HTTP 200 với `{ user: null }`
- **Fix**: Throw NotFoundException

### BE-AUTH-04 🟢 Low — Email verification bypassed ngoài production

- **File**: `backend/src/auth/auth.ts` dòng 30
- **Mô tả**: `requireEmailVerification: process.env.NODE_ENV === "production"` — staging không cần verify
- **Fix**: `requireEmailVerification: process.env.NODE_ENV !== 'development'`

---

## Payments Module

### BE-PAY-01 🔴 Critical — Mock webhook cho phép free payment

- **File**: `backend/src/modules/payments/payments.service.ts` dòng 85-93
- **Mô tả**: `handleWebhook()` routing theo header `x-payment-gateway`. Nếu `mock` → không có signature verification → attacker có thể activate job free
- **Fix**:
```typescript
if (gateway === 'mock' && process.env.NODE_ENV === 'production') {
  throw new ForbiddenException('Mock gateway not available in production');
}
```

### BE-PAY-02 🔴 Critical — Webhook đọc parsed JSON thay vì raw Buffer

- **File**: `backend/src/modules/payments/payments.controller.ts` dòng 49
- **Mô tả**: `req.body` đã được parse thành JS object, nhưng Stripe webhook cần raw Buffer để verify signature
- **Fix**: Dùng `req.rawBody` thay vì `req.body`

### BE-PAY-03 🟢 Significant — Mock payment thiếu ownership check

- **File**: `backend/src/modules/payments/payments.controller.ts` dòng 53-71
- **Mô tả**: `mockComplete()` endpoint có `@Roles('EMPLOYER')` nhưng không verify user owns job → employer khác có thể activate job
- **Fix**: Thêm ownership check

### BE-PAY-04 🟢 Significant — Payment detail thiếu ownership check

- **File**: `backend/src/modules/payments/payments.service.ts` dòng 271-278
- **Mô tả**: `GET /payments/:id` trả về payment detail cho bất kỳ EMPLOYER nào
- **Fix**: Verify `payment.userId === requestingUserId`

### BE-PAY-05 🟡 Medium — Payment không validate job state trước khi activate

- **File**: `backend/src/modules/payments/payments.service.ts` dòng 212-253
- **Mô tả**: `completePayment()` activate job mà không check current status → job CLOSED có thể bị re-activate bởi duplicate webhook
- **Fix**: Check `job.status === 'PENDING'` trước khi activate

### BE-PAY-06 🟡 Medium — Payment deadline ignores existing deadline

- **File**: `backend/src/modules/payments/payments.service.ts` dòng 153-234
- **Mô tả**: Deadline tính `new Date() + package.days` thay vì `existingDeadline + days` → employer mất thời gian còn lại khi renew
- **Fix**: Extend từ existing deadline nếu có

---

## Jobs Module

### BE-JOBS-01 🟢 Significant — Public listing leak DRAFT/PENDING jobs

- **File**: `backend/src/modules/jobs/jobs.controller.ts` dòng 15-33
- **Mô tả**: Endpoint `@Public()` accept `status` query param → attacker có thể query `status=DRAFT` để thấy unpublished jobs
- **Fix**: Ignore `status` param cho public queries, luôn filter `ACTIVE`

### BE-JOBS-02 🟡 Medium — Missing @Roles trên job update

- **File**: `backend/src/modules/jobs/jobs.controller.ts` dòng 80-89
- **Mô tả**: `PATCH /jobs/:id` không có `@Roles()` decorator → CANDIDATE có thể gọi (service check ownership nhưng RolesGuard không chạy)
- **Fix**: Thêm `@Roles('EMPLOYER', 'ADMIN')`

### BE-JOBS-03 🟢 Low — Job slug collision risk

- **File**: `backend/src/modules/jobs/jobs.service.ts` dòng 131
- **Mô tả**: Slug = `slugify(title) + Date.now().toString(36)` — nếu 2 jobs cùng title cùng millisecond → collision
- **Fix**: Thêm uniqueness check hoặc retry

---

## Applications Module

### BE-APP-01 🟢 Resolved — Application delete hai phía, không rút/hủy ứng tuyển

- **File**: `backend/src/modules/applications/applications.service.ts` dòng 172-178
- **Mô tả**: Flow cũ từng cho candidate withdraw application theo nghĩa hủy đơn.
- **Fix hiện tại**: Candidate và employer xoá độc lập khỏi workspace bằng `candidateDeletedAt` / `employerDeletedAt`. Candidate delete giải phóng quota nhưng không cho apply lại cùng job nếu employer chưa xoá. DB chỉ xoá vật lý khi cả hai phía đều xoá.

### BE-APP-02 🟡 Medium — Application có thể nộp không có CV

- **File**: `backend/src/modules/applications/dto/application.dto.ts` dòng 4-23
- **Mô tả**: Tất cả fields trừ `jobId` đều optional → nộp đơn trống
- **Fix**: Require ít nhất 1 trong `cvUrl` hoặc `resumeId`

### BE-APP-03 🟢 Low — UpdateApplicationStatusDto cho phép PENDING

- **File**: `backend/src/modules/applications/dto/application.dto.ts` dòng 25-28
- **Mô tả**: DTO cho phép status `PENDING` nhưng service không cho phép transition TO PENDING
- **Fix**: `@IsEnum(['REVIEWING', 'ACCEPTED', 'REJECTED'])`

### BE-APP-04 🟢 Low — Employer applications không có filter

- **File**: `backend/src/modules/applications/applications.controller.ts` dòng 38-48
- **Mô tả**: `GET /applications/employer` trả về TẤT CẢ applications, không filter theo status/job
- **Fix**: Thêm query params `status`, `jobId`

---

## Resumes Module

### BE-RES-01 🟢 Significant — XSS qua template data interpolation

- **File**: `backend/src/modules/resumes/template-engine.service.ts` dòng 100-117
- **Mô tả**: `interpolate()` replace `{{field}}` với raw user data không escape HTML → stored XSS
- **Fix**:
```typescript
private escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
```

### BE-RES-02 🟢 Significant — Public render-template accept unvalidated data

- **File**: `backend/src/modules/resumes/resumes.controller.ts` dòng 113-120
- **Mô tả**: `POST /resumes/render-template` là `@Public()` và accept `data: any` không DTO → XSS vector
- **Fix**: Tạo DTO với validation

### BE-RES-03 🟢 Significant — getTemplates không thấy private templates

- **File**: `backend/src/modules/resumes/resumes.controller.ts` dòng 18-28
- **Mô tả**: Endpoint `@Public()` + `@CurrentUser()` → AuthGuard skip → `user` luôn undefined → chỉ thấy public templates
- **Fix**: Tách endpoint public và authenticated

### BE-RES-04 🟡 Medium — Resume create/update accept arbitrary fields

- **File**: `backend/src/modules/resumes/resumes.service.ts` dòng 39-64
- **Mô tả**: Service accept `Record<string, unknown>` và cast sang Prisma type → có thể write arbitrary fields
- **Fix**: Sử dụng DTO type thay vì Record

### BE-RES-05 🟡 Medium — Resume DTO thiếu element validation

- **File**: `backend/src/modules/resumes/dto/resume.dto.ts` dòng 17-30
- **Mô tả**: Array fields (`education`, `experience`, `projects`) chỉ validate `@IsArray()`, không validate elements
- **Fix**: Thêm `@ValidateNested()` + `@Type()`

### BE-RES-06 🟡 Medium — Controller double-wraps response

- **File**: `backend/src/modules/resumes/resumes.controller.ts` nhiều dòng
- **Mô tả**: Controller trả `{ data: ... }` + ResponseTransformInterceptor wrap thêm → `{ data: { data: ... } }`
- **Fix**: Bỏ wrapper trong controller, để interceptor wrap

---

## Notifications Module

### BE-NOTIF-01 — Không có issues

Module này hoạt động đúng.

---

## Blogs Module

### BE-BLOG-01 🟡 Medium — View count inflation và stale cache

- **File**: `backend/src/modules/blogs/blogs.service.ts` dòng 85-109
- **Mô tả**: View count increment trong DB nhưng cache trả về old count → count luôn sai
- **Fix**: Invalidate cache sau khi increment

### BE-BLOG-02 🟢 Low — Blog category deletion không check blogs

- **File**: `backend/src/modules/blog-categories/blog-categories.service.ts` dòng 41-45
- **Mô tả**: Xóa category mà không check có blog posts nào đang dùng → orphaned records hoặc FK error
- **Fix**: Check `blogCount > 0` trước khi xóa

---

## Pricing Module

### BE-PRIC-01 🟢 Low — Remove dùng NotFoundException thay vì ConflictException

- **File**: `backend/src/modules/pricing/pricing.service.ts` dòng 75
- **Mô tả**: Package có payments → throw NotFoundException (404) thay vì ConflictException (409)
- **Fix**: Đổi sang `ConflictException`

---

## Address Module

### BE-ADDR-01 🟡 Medium — getFullAddress trả về null thay vì 404

- **File**: `backend/src/modules/address/address.service.ts` dòng 58-72
- **Mô tả**: Ward không tìm thấy → trả `{ data: null }` HTTP 200
- **Fix**: Throw NotFoundException

---

## Users Module

### BE-USERS-01 🟡 Medium — Audit log ghi wrong actorId

- **File**: `backend/src/modules/users/users.service.ts` dòng 70-108
- **Mô tả**: `toggleActive/toggleLock/remove` ghi `actorId: id` (target user ID) thay vì admin ID
- **Fix**: Truyền admin ID vào service methods

### BE-USERS-02 🟢 Low — User query role không validate enum

- **File**: `backend/src/modules/users/dto/user.dto.ts` dòng 70-72
- **Mô tả**: `role` field là `@IsString()` thay vì `@IsEnum(Role)`
- **Fix**: Đổi sang `@IsEnum(Role)`

---

## Audit Module

### BE-AUDIT-01 🟡 Medium — findById trả về null thay vì 404

- **File**: `backend/src/modules/audit/audit.service.ts` dòng 79-81
- **Mô tả**: `findUnique()` trả null → HTTP 200 `{ data: null }`
- **Fix**: Throw NotFoundException

---

## Scalar Auth Module

### BE-SCALAR-01 🟢 Low — Register accept role field

- **File**: `backend/src/auth/scalar-auth.controller.ts` dòng 54-56
- **Mô tả**: `register()` accept `role` field và forward đến better-auth → admin escalation vector
- **Fix**: Strip role trước khi forward

### BE-SCALAR-02 🟢 Low — Login thiếu input validation

- **File**: `backend/src/auth/scalar-auth.controller.ts` dòng 19-43
- **Mô tả**: `login()` accept raw body không DTO validation
- **Fix**: Tạo DTO với validation

### BE-SCALAR-03 🟢 Low — Rate limiting concerns

- **File**: `backend/src/auth/scalar-auth.controller.ts` dòng 11-107
- **Mô tả**: Login/register endpoints là `@Public()` với default rate limit 100 req/min — quá cao cho auth endpoints
- **Fix**: Thêm stricter rate limiting

---

## Global / Infrastructure

### BE-GLOBAL-01 🟢 Significant — Exception filter leaks error details

- **File**: `backend/src/common/filters/global-exception.filter.ts` dòng 32
- **Mô tả**: Non-HttpException → `exception.message` gửi thẳng cho client → leak internal details
- **Fix**:
```typescript
message = process.env.NODE_ENV === 'production'
  ? 'Internal server error'
  : exception.message;
```

### BE-GLOBAL-02 🟢 Significant — Missing Helmet middleware

- **File**: `backend/src/main.ts`
- **Mô tả**: Không có helmet → thiếu security headers (CSP, HSTS, X-Frame-Options)
- **Fix**: `pnpm add helmet` + `app.use(helmet())`

### BE-GLOBAL-03 🟢 Significant — Rate limiting in-memory only

- **File**: `backend/src/app.module.ts` dòng 33-36
- **Mô tả**: `ThrottlerModule` dùng default in-memory storage → không work với multi-instance
- **Fix**: Dùng `ThrottlerStorageRedisService`

### BE-GLOBAL-04 🟡 Medium — ValidationPipe thiếu forbidNonWhitelisted

- **File**: `backend/src/main.ts` dòng 93-98
- **Mô tả**: `whitelist: true` nhưng không có `forbidNonWhitelisted: true` → silent discard thay vì reject
- **Fix**: Thêm `forbidNonWhitelisted: true`

### BE-GLOBAL-05 🟡 Medium — Exception filter loses multiple validation errors

- **File**: `backend/src/common/filters/global-exception.filter.ts` dòng 38
- **Mô tả**: `Array.isArray(message) ? message[0] : message` → chỉ trả lỗi đầu tiên
- **Fix**: Trả tất cả errors

### BE-GLOBAL-06 🟡 Medium — Template engine wildcard postMessage origin

- **File**: `backend/src/modules/resumes/template-engine.service.ts` dòng 83
- **Mô tả**: `window.parent.postMessage({...}, '*')` → bất kỳ page nào embed CV đều nhận events
- **Fix**: Dùng `FRONTEND_URL` thay vì `*`

### BE-GLOBAL-07 🟡 Medium — Blog landingContent accept unvalidated JS

- **File**: `backend/src/modules/blogs/dto/blog.dto.ts` dòng 17-19
- **Mô tả**: `landingContent` có `js?: string` field → stored XSS vector
- **Fix**: Sanitize với DOMPurify hoặc xóa `js` field

### BE-GLOBAL-08 🟢 Low — Swagger/Scalar docs publicly accessible

- **File**: `backend/src/main.ts` dòng 74-88
- **Mô tả**: `/docs` không có auth → expose toàn bộ API surface
- **Fix**: Disable trong production

### BE-GLOBAL-09 🟢 Low — Inngest serve handler duplication

- **Files**: `main.ts` dòng 26-37 + `inngest.controller.ts` dòng 23-37
- **Mô tả**: Cả 2 files đều register cùng Inngest functions → duplicate
- **Fix**: Xóa một trong hai

---

# PHẦN 3: DEAD CODE

## Backend Dead Files (8 files + 2 directories)

| # | File | Status |
|---|------|--------|
| 1 | `backend/src/auth/dto/login.dto.ts` | Never imported |
| 2 | `backend/src/common/pipes/parse-cuid.pipe.ts` | Never imported |
| 3 | `backend/src/common/dto/response.dto.ts` | Never imported |
| 4 | `backend/src/common/types/request.types.ts` | Never imported |
| 5 | `backend/src/common/types/response.types.ts` | Never imported |
| 6 | `backend/src/common/types/index.ts` | Barrel, never imported |
| 7 | `backend/src/common/cache/index.ts` | Barrel, never imported |
| 8 | `backend/src/modules/shared/contracts/index.ts` | Barrel, never imported |

## Backend Partially Dead Code

| # | File | What's dead |
|---|------|-------------|
| 1 | `backend/src/modules/users/dto/user.dto.ts` | `UserResponseDto` class |
| 2 | `backend/src/inngest/inngest.service.ts` | `sendBatch()` method |
| 3 | `backend/src/modules/payments/gateways/mock.gateway.ts` | `verifyWebhook()` method |

## Backend Duplicated Code

| # | What | Where |
|---|------|-------|
| 1 | `CheckoutResult` interface | `stripe.gateway.ts` + `mock.gateway.ts` |
| 2 | Inngest function registration | `main.ts` + `inngest.controller.ts` |

---

# PHẦN 4: ĐÃ FIX TRONG SESSION NÀY

| # | Issue | Fix |
|---|-------|-----|
| 1 | Login fail (password hash mismatch) | Tạo users mới với better-auth API |
| 2 | Salary format "8000 triệu" | `/1000` → `/1000000` |
| 3 | Companies page 0 items | Cache refresh |
| 4 | Blog page 0 items | Cache refresh |
| 5 | Company size raw enum | Thêm SIZE_LABELS mapping |
| 6 | Resume templates API double-wrapped | Bỏ wrapper trong controller |
| 7 | Sonner not installed | `npx shadcn@latest add sonner` |
| 8 | Auth pages use inline div for errors | Đổi sang `toast.error()` |
| 9 | Python agent dead code (~1,042 lines) | Xóa `src/`, 5 dead tools, `routers/` |
| 10 | Recruiter prompt references ghost tools | Fix prompt với actual tools |
| 11 | ApiClient duplicate headers | Clean up |
| 12 | BaseAgent duplication | Refactor với template method hooks |
| 13 | CandidateAgent 208→65 lines | Dùng hooks thay vì override |
| 14 | Agent creation duplication | Tạo `agent_factory.py` |
| 15 | Dashboard 759→160 lines | Extract `StatsCards`, `RecentApplications` |
| 16 | Duplicate timeAgo functions | Extract to `lib/utils/date.ts` |
| 17 | Duplicate formatSalary functions | Extract to `lib/utils/format.ts` |
| 18 | Duplicate notification pages | Shared imports |
