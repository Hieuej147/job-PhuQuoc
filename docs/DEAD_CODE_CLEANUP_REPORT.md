# Dead Code Cleanup Report

## Đã xử lý trong lần này

- Cập nhật lại flow `DELETE /applications/:id`: không còn là "rút đơn" theo nghĩa hủy ứng tuyển, mà là ẩn application khỏi workspace của candidate để giải phóng quota.
- Thêm flow employer xoá riêng `DELETE /applications/:id/employer`: ẩn application khỏi workspace employer.
- Chỉ xoá vật lý `JobApplication` khi cả `candidateDeletedAt` và `employerDeletedAt` đều có giá trị; khi đó `ApplicationMessage` xoá theo cascade.
- Sửa chat notification `refType` từ kiểu riêng về `application` để dùng chung deep link hiện có.
- Refactor `auth/register/page.tsx` để bỏ step employer thứ 4 không render nội dung.
- Nối `QuotaUpgradeDialog` vào API nâng gói demo, không còn nút chỉ đóng modal.
- Cập nhật các docs cũ (`cv.md`, `API_ENDPOINT_FE_USAGE_AUDIT.md`, `fixdetailjob.md`, `PROJECT_ISSUES.md`) để không hướng dẫn team làm flow rút đơn nữa.
- Siết lại định hướng chat: không chat mọi trạng thái; chỉ `ACCEPTED` mới chat hai chiều, `REJECTED` là lời nhắn read-only.
- Tạo handoff riêng `docs/EMAIL_GMAIL_AI_IMPLEMENTATION_HANDOFF.md` để team làm Gmail/AI Email sau này, tránh trộn Email với chat app.
- Thêm quota package có thời hạn 1/3/12 tháng và Inngest repair/downgrade khi hết hạn.
- Thêm route edit job riêng `/employer/jobs/[id]/edit`; sửa job đang ACTIVE chỉ cập nhật nội dung DB/cache/embedding, không reset payment/deadline và không emit lại `job.activated`.
- Cập nhật PM2 Inngest wrapper để đợi backend `/api/inngest` ready rồi mới start Inngest dev UI, tránh restart/log spam.

## Giữ lại có chủ đích

- Admin BE delete routes giữ nguyên theo yêu cầu.
- `DELETE /applications/:id` giữ lại nhưng đã đổi nghĩa thành xoá khỏi workspace candidate; không phải hủy application đang nộp.
- Các component shared lớn như `Header`, `JobFilter`, blog clients chưa xoá vì vẫn có route/import dùng.

## Cần giao tiếp với team

- Business rule hiện tại: candidate đã nộp thì không được "rút đơn" để hủy trạng thái ứng tuyển. Candidate chỉ được xoá khỏi danh sách của mình; employer có workspace delete riêng.
- Candidate chỉ apply lại cùng job khi record cũ đã bị xoá vật lý, tức cả candidate và employer đều đã xoá.
- Nếu team gặp tài liệu/nhánh cũ còn nút "Bỏ ứng tuyển" theo nghĩa rút/hủy đơn, xem đó là obsolete và không merge lại UI đó.
