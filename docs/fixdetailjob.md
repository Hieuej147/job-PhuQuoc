# Fix: Luồng Ứng Tuyển Hoàn Chỉnh (Job Detail Apply Flow)

> Ngày: 2026-06-21  
> Người phân tích: Antigravity AI

---

## 1. Hiện trạng hệ thống

### Backend – Đã có (không cần thêm)

| Endpoint | Method | Mô tả |
|----------|--------|--------|
| `/api/v1/applications` | POST | Candidate nộp CV (`jobId`, `resumeId?`, `cvUrl?`, `coverLetter?`) |
| `/api/v1/applications/my` | GET | Candidate xem đơn đã nộp |
| `/api/v1/applications/employer` | GET | Employer xem danh sách ứng viên |
| `/api/v1/applications/job/:jobId` | GET | Employer xem ứng viên theo job |
| `/api/v1/applications/:id/status` | PATCH | Employer duyệt/từ chối (`PENDING → REVIEWING → ACCEPTED/REJECTED`) |
| `/api/v1/applications/:id/bookmark` | PATCH | Employer đánh dấu bookmark |
| `/api/v1/resumes/my` | GET | Candidate lấy danh sách CV đã lưu |
| `/api/v1/resumes/:id/pdf` | GET | Export PDF — **chỉ owner** (candidate) |
| `/api/upload` | POST | Upload file PDF → lưu `web/public/uploads/` → trả URL public `/uploads/...` |

### Frontend – Đã có

- **JobDetailClient.tsx** (`/jobs/[slug]`): Modal apply với 2 tab
  - Tab "CV đã lưu": gọi `GET /api/v1/resumes/my`, chọn từ danh sách
  - Tab "Upload PDF": upload qua `POST /api/upload`, nhận URL
  - Gửi `POST /api/v1/applications` với body phù hợp
- **Employer Applications page** (`/employer/applications`): Danh sách ứng viên, nút Xem CV / Duyệt / Từ chối

---

## 2. Bugs cần fix

### Bug 1 🔴 — Employer xem CV saved bị 403

**Nguyên nhân:**  
Employer nhấn "Xem CV" → gọi `/api/v1/resumes/:id/pdf`  
Endpoint này kiểm tra `user.id === resume.userId` → Employer không phải owner → `403 Forbidden`

**Fix:**  
Thêm endpoint mới dành riêng cho employer:

```
GET /api/v1/applications/:id/resume-pdf
Role: EMPLOYER
```

Logic:
1. Tìm application theo `id`
2. Kiểm tra `application.job.company.ownerId === employerId`
3. Nếu `application.cvUrl` → redirect hoặc trả `{ url: cvUrl }`
4. Nếu `application.resumeId` → gọi `ResumesService.generatePdf()` bỏ qua kiểm tra owner → stream PDF

**Files cần sửa:**
- `backend/src/modules/applications/applications.controller.ts` — thêm route
- `backend/src/modules/applications/applications.service.ts` — thêm method `getResumePdfForEmployer`
- `backend/src/modules/applications/applications.module.ts` — import `ResumesModule`

---

### Bug 2 🟡 — Response format sai → danh sách employer luôn rỗng

**Nguyên nhân:**  
`ApplicationsService.findByEmployer()` trả về:
```json
{ "items": [...], "total": 10, "page": 1, ... }
```
Nhưng Frontend đọc: `d.data?.items ?? []` → `data` là `undefined` → luôn rỗng

**Fix (chọn 1 trong 2):**

Option A — Fix Backend (khuyến nghị, đồng nhất với các API khác):
```ts
// applications.service.ts - findByEmployer & findByJob
return { data: { items, total, page, limit, totalPages } };
```

Option B — Fix Frontend:
```ts
// employer/applications/page.tsx
.then((d) => setApps(d.data?.items ?? d.items ?? []))
```

---

## 3. Luồng hoàn chỉnh sau khi fix

```
┌─────────────────────────────────────────────────────────────────┐
│                     CANDIDATE – Ứng tuyển                       │
└─────────────────────────────────────────────────────────────────┘

1. Candidate vào /jobs/[slug]
2. Nhấn "Ứng tuyển"
   └── Chưa đăng nhập? → redirect /auth/login?redirect=/jobs/[slug]
3. Modal mở ra, chọn tab:
   ├── Tab "CV đã lưu"
   │   GET /api/v1/resumes/my
   │   → Hiện dropdown các CV (bỏ qua PROFILE_MASTER)
   │   → Chọn CV → lấy resumeId
   │
   └── Tab "Upload PDF"
       → Chọn file .pdf (tối đa 10MB)
       POST /api/upload  { file: <File> }
       → Nhận { url: "/uploads/timestamp_filename.pdf" }
       → Lưu cvUrl

4. (Tùy chọn) Nhập thư giới thiệu (coverLetter)

5. Nhấn "Gửi đơn ứng tuyển"
   POST /api/v1/applications
   Body: { jobId, resumeId? | cvUrl?, coverLetter? }
   
   Response 201: Application created (status: PENDING)
   Response 409: Đã ứng tuyển rồi
   Response 400: Job không active

6. Backend:
   - Lưu JobApplication vào DB
   - Gửi Inngest event "application.created"
   - Inngest → tạo Notification cho Employer

┌─────────────────────────────────────────────────────────────────┐
│                  EMPLOYER – Quản lý hồ sơ                       │
└─────────────────────────────────────────────────────────────────┘

1. Employer vào /employer/applications
2. GET /api/v1/applications/employer?limit=50
   → Trả về danh sách ứng viên kèm:
     - user (name, email, phone)
     - job (title)
     - resume (toàn bộ CandidateResume object)
     - cvUrl (nếu upload PDF)
     - coverLetter
     - status (PENDING/REVIEWING/ACCEPTED/REJECTED)

3. Xem CV:
   ├── cvUrl có giá trị
   │   → window.open(cvUrl, "_blank")  [URL public, không cần auth]
   │
   └── resumeId có giá trị
       → window.open(`/api/v1/applications/${app.id}/resume-pdf`, "_blank")
       → Backend verify employer ownership → stream PDF

4. Duyệt / Từ chối:
   PATCH /api/v1/applications/:id/status
   Body: { status: "ACCEPTED" | "REJECTED" | "REVIEWING" }
   
   Transitions hợp lệ:
   PENDING → REVIEWING | ACCEPTED | REJECTED
   REVIEWING → ACCEPTED | REJECTED
   ACCEPTED → (terminal)
   REJECTED → (terminal)

   Backend:
   - Cập nhật status trong DB
   - Gửi Inngest event "application.accepted" | "application.rejected"
   - Inngest → tạo Notification cho Candidate
```

---

## 4. Danh sách file cần thay đổi

### Backend

| File | Thay đổi |
|------|----------|
| `backend/src/modules/applications/applications.controller.ts` | Thêm `GET /:id/resume-pdf` + `Res` streaming |
| `backend/src/modules/applications/applications.service.ts` | Thêm `getResumePdfForEmployer()`, fix response wrap `data:{}` |
| `backend/src/modules/applications/applications.module.ts` | Import `ResumesModule` |

### Frontend

| File | Thay đổi |
|------|----------|
| `web/src/app/employer/applications/page.tsx` | Fix đọc `d.data?.items`, fix URL xem CV sang endpoint mới |
| `web/src/app/(main)/jobs/[slug]/JobDetailClient.tsx` | (Không cần sửa — đã đúng) |

---

## 5. Schema DB (tham khảo)

```prisma
model JobApplication {
  id           String            @id @default(cuid())
  userId       String
  jobId        String
  cvUrl        String?           // URL public nếu upload PDF
  resumeId     String?           // ID CandidateResume nếu dùng CV đã lưu
  coverLetter  String?
  status       ApplicationStatus @default(PENDING)
  isBookmarked Boolean           @default(false)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  user   user?            @relation(...)
  job    Job              @relation(...)
  resume CandidateResume? @relation(...)
}
```

---

## 6. Test checklist

- [ ] Candidate đăng nhập → vào job detail → ứng tuyển bằng CV đã lưu → DB có record
- [ ] Candidate đăng nhập → ứng tuyển bằng Upload PDF → file xuất hiện trong `web/public/uploads/`
- [ ] Ứng tuyển lần 2 cùng job → nhận 409 Conflict
- [ ] Employer đăng nhập → `/employer/applications` → danh sách hiện đúng (không rỗng)
- [ ] Employer nhấn "Xem CV" (loại cvUrl) → PDF mở tab mới
- [ ] Employer nhấn "Xem CV" (loại resumeId) → PDF mở tab mới (không 403)
- [x] Employer nhấn "Duyệt" → status chuyển ACCEPTED, Candidate nhận notification
- [x] Employer nhấn "Từ chối" → status chuyển REJECTED, Candidate nhận notification

---

## 7. Cập nhật các lỗi đã sửa bổ sung (Update - 22/06/2026)

### Lỗi 500 khi Inngest offline (TypeError: fetch failed)
* **Vấn đề:** Khi candidate nhấn ứng tuyển hoặc rút đơn ứng tuyển, Backend cố gắng gửi event qua `InngestService.send()`. Nếu Inngest dev server không chạy (offline), request HTTP ném ra lỗi `fetch failed` làm crash cả request và trả về HTTP 500 cho client.
* **Cách sửa:** Sửa `InngestService.send()` và `sendBatch()` trong `backend/src/inngest/inngest.service.ts`, chuyển sang dạng **fire-and-forget** (bắt lỗi bằng `.catch()` và log warning, không dùng `throw error`). Giúp API ứng tuyển luôn thành công độc lập với trạng thái hoạt động của Inngest.

### Lỗi biên dịch TypeScript ở Backend (Test files)
* **Vấn đề:** Thay đổi cấu trúc Constructor của `ApplicationsService` ở backend làm phát sinh lỗi biên dịch TS ở file test `backend/test/applications.service.spec.ts` (thiếu tham số thứ 6 `ResumesService` và kiểm tra sai cấu trúc dữ liệu trả về của `findByJob`). Khiến NestJS CLI watch mode không thể biên dịch code chạy thực tế.
* **Cách sửa:** Cập nhật file test: mock và bổ sung `resumesServiceMock` vào constructor, sửa assert từ `result.items` thành `result.data.items`. Backend đã biên dịch thành công 100% với 0 lỗi.

### Hỗ trợ chức năng rút ứng tuyển (Bỏ ứng tuyển)
* **Vấn đề:** Bổ sung quyền cho candidate rút đơn ứng tuyển nếu đã nộp.
* **Cách sửa:** 
  * Frontend gọi `DELETE /api/v1/applications/:id` khi candidate nhấn "Bỏ ứng tuyển".
  * State trên UI được cập nhật tức thời (chuyển đổi nút "Đã ứng tuyển / Bỏ ứng tuyển" <=> "Ứng tuyển ngay") mà không cần load lại trang.

