# Đề xuất thiết kế lại CV / Resume

## 1. Nhận xét hiện trạng

Luồng CV hiện tại chưa nên tiếp tục mở rộng trực tiếp vì đang trộn nhiều khái niệm khác nhau:

- **Profile cá nhân**: thông tin gốc của candidate như tên, số điện thoại, ảnh, kinh nghiệm, học vấn.
- **Resume/CV đã lưu**: một bản CV cụ thể dùng để ứng tuyển hoặc xuất PDF.
- **Template thiết kế**: layout HTML/CSS hoặc template do AI/MCP sinh ra.
- **File ứng tuyển**: PDF upload hoặc PDF export từ CV đã lưu.
- **Quyền xem CV**: candidate xem CV của mình, employer chỉ được xem CV thông qua application thuộc job của công ty họ.

Cách dùng `PROFILE_MASTER` để lưu profile vào bảng resume là không ổn lâu dài. Nó làm resume vừa là hồ sơ cá nhân, vừa là CV ứng tuyển, vừa là nguồn dữ liệu cho dashboard. Khi sau này thêm AI CV hoặc MCP CV builder, logic sẽ càng khó kiểm soát.

## 2. Nguyên tắc thiết kế mới

- Candidate profile phải là nguồn dữ liệu riêng, không dùng một resume ẩn để giả lập profile.
- Resume là snapshot có chủ đích: candidate tạo, chỉnh, lưu, dùng để apply.
- Template ID phải do DB/backend quản lý, không hard-code `tpl-*` ở FE hoặc agent.
- Upload PDF không được lưu public trong `web/public/uploads` ở production.
- Employer không được xem CV bằng `resumeId` trực tiếp; phải đi qua `applicationId` và backend kiểm tra ownership.
- Không dùng bypass auth bằng query string cho Puppeteer hoặc export PDF.

## 3. Kiến trúc đề xuất

### CandidateProfile
Lưu thông tin nền của candidate:

- userId
- address
- summary
- education
- experience
- projects
- skills
- socialLinks
- languages

Dữ liệu này dùng cho dashboard, profile page, và làm nguồn prefill khi tạo CV mới.

### CandidateResume
Lưu từng CV cụ thể:

- userId
- title
- snapshotData JSON
- templateId hoặc designSource
- html/css đã validate nếu dùng AI/MCP generated template
- isDefault
- createdAt / updatedAt

Resume không nên bị dùng làm profile ẩn.

### ResumeAsset
Lưu metadata file PDF/upload/export:

- userId
- resumeId nullable
- applicationId nullable
- storageKey
- originalName
- mimeType
- size
- source: `UPLOAD` hoặc `EXPORT`

File thật nên nằm ở private storage hoặc thư mục private backend, không nằm public static folder.

### JobApplication
Khi ứng tuyển, application chỉ tham chiếu:

- resumeId nếu candidate chọn CV đã lưu
- resumeAssetId nếu candidate upload PDF
- coverLetter

Employer xem CV bằng endpoint theo `applicationId`, backend kiểm tra application đó thuộc job của công ty employer.

## 4. Luồng chuẩn đề xuất

### Candidate cập nhật profile

1. FE gọi endpoint profile riêng.
2. Backend lưu vào CandidateProfile.
3. Dashboard/checklist đọc CandidateProfile, không đọc resume ẩn.

### Candidate tạo CV

1. FE hoặc AI lấy CandidateProfile để prefill.
2. Candidate chọn hoặc sinh template.
3. Backend validate template/data.
4. Backend tạo CandidateResume với ID DB-generated.
5. Candidate có thể preview/export/apply bằng resume đó.

### Candidate upload PDF khi ứng tuyển

1. FE gửi file qua endpoint upload có auth.
2. Backend kiểm tra role candidate, MIME, size.
3. Backend lưu private storage và tạo ResumeAsset.
4. Application lưu `resumeAssetId`, không lưu URL public.

### Employer xem CV ứng viên

1. FE gọi `GET /api/v1/applications/:id/resume` có auth employer để lấy payload CV.
2. Backend kiểm tra `application.job.company.ownerId === employerId`.
3. Nếu là upload PDF, FE dùng `GET /api/v1/applications/:id/resume-file`; backend proxy/stream PDF inline sau khi kiểm ownership.
4. Nếu là resume đã lưu, FE render bằng A4 renderer và export bằng browser print; backend không render PDF trong phase hiện tại.

## 5. Phase triển khai đề xuất

### Phase 1: Dọn rủi ro hiện tại

- Bỏ auth bypass bằng query/header.
- Bỏ public upload route.
- Bỏ file PDF đã commit.
- Bỏ `PROFILE_MASTER` khỏi hướng phát triển mới.
- Giữ UI candidate applications/saved nếu không phụ thuộc CV cũ.

### Phase 2: Tách CandidateProfile

- Thêm model/API profile riêng.
- Chuyển profile page sang dùng profile API.
- Dashboard checklist đọc profile API.

### Phase 3: Làm lại CV builder

- Resume lưu snapshot độc lập.
- Template hoặc AI-generated design phải validate trước khi lưu.
- Không hard-code template ID ở FE.

### Phase 4: Làm private file/PDF flow

- Upload file qua backend auth.
- Lưu private storage.
- Employer xem CV qua application ownership.
- Export PDF không cần bypass auth.

## 6. Quyết định tạm thời cho nhánh `codeupdate2`

- Không merge cơ chế CV/template từ `codeupdate`.
- Không giữ docs cũ mô tả `PROFILE_MASTER`, public PDF, hoặc bypass Puppeteer.
- Chỉ giữ lại UI candidate applications/saved nếu build ổn.
- Employer applications và CV review sẽ làm lại sau theo application ownership chuẩn.


## 7. Trạng thái triển khai hiện tại 2026-07-01

Phase hiện tại đã chọn hướng **FE render - BE trả dữ liệu**:

- `GET /api/v1/resumes/:id/pdf` và backend Puppeteer PDF đã bị loại khỏi luồng chính.
- Candidate export CV bằng route FE `/resumes/:id/print` với `ResumePrintDocument`.
- Employer xem CV qua modal `/employer/applications`:
  - CV tạo online: `GET /api/v1/applications/:id/resume` rồi FE render A4.
  - CV upload PDF: `GET /api/v1/applications/:id/resume-file`, backend stream inline.
- Candidate upload PDF ứng tuyển qua `POST /api/v1/upload/candidate-cv`; backend validate role, MIME PDF, size 10MB và lưu Cloudinary.
- Application terminal cleanup chạy bằng Inngest:
  - `REJECTED` xoá sau 14 ngày.
  - `ACCEPTED` xoá sau 30 ngày.

Ghi chú còn lại: hiện `JobApplication` mới lưu `cvUrl`, chưa lưu `cvPublicId`. Nếu muốn cleanup cả file Cloudinary khi application bị xoá, nên thêm `cvPublicId` vào schema ở phase sau.
