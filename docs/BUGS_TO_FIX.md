# Bugs / Risks To Fix Later

Cập nhật: 2026-06-11

## Verification Note

- Đã chạy bằng Node/pnpm từ nvm path: `/home/hieubc/.local/share/nvm/v20.19.4/bin`.
- `pnpm --dir backend test`: pass 19 files, 164 tests; 1 e2e file skipped theo cấu hình hiện tại.
- `pnpm --dir backend build`: pass.
- `pnpm --dir web build`: pass. Build vẫn báo warning `turbopack.root should be absolute`, chưa ảnh hưởng output.
- `pm2 -v` chưa chạy được trong sandbox vì PM2 cần ghi socket/log vào `/home/hieubc/.pm2`.
- Đã chạy kiểm tra không cần Node: `git diff --check` và grep các đường auth cũ. Kết quả hiện tại không còn lỗi whitespace hoặc direct auth URL cũ.

## Pending Issues

1. Employer registration UI còn lệch step.
   - File: `web/src/app/auth/register/page.tsx`
   - `totalSteps` là 4 khi chọn `EMPLOYER`, nhưng UI hiện chỉ render luồng tạo tài khoản/mật khẩu; chưa có step thông tin công ty thật sự. Cần quyết định: bỏ step công ty khỏi register v1 hoặc implement đầy đủ company onboarding.

2. Public jobs endpoint vẫn expose query `status`.
   - File: `backend/src/modules/jobs/jobs.controller.ts`, `backend/src/modules/jobs/jobs.service.ts`
   - Controller public docs cho phép filter `DRAFT/PENDING/ACTIVE/CLOSED`. Cần audit service để đảm bảo public user không thể lấy job chưa active bằng query `status`.

3. Payment mock fallback cần production policy rõ hơn.
   - File: `backend/src/modules/payments/payments.service.ts`, `backend/src/modules/payments/payments.controller.ts`
   - `createCheckout` tự fallback sang mock nếu Stripe gateway chưa enable. Nên chặn mock gateway trong production hoặc fail fast khi thiếu Stripe env.

4. CV/template HTML rendering cần audit XSS end-to-end.
   - Files: `backend/src/modules/resumes/template-engine.service.ts`, `web/src/components/cv/*`, `web/src/app/candidate/resumes/templates/page.tsx`
   - Backend có validator/sanitizer nhưng frontend vẫn render template bằng `dangerouslySetInnerHTML`. Cần test payload độc hại và xác nhận sanitizer áp dụng ở mọi entry point.

5. Candidate profile save thiếu UX lỗi/thành công.
   - File: `web/src/app/candidate/profile/page.tsx`
   - Hiện `PATCH /api/v1/auth/me` không hiển thị lỗi hoặc success state. Không ảnh hưởng security, nhưng dễ làm user tưởng đã lưu khi request fail.

6. Admin UI chưa có.
   - Frontend hiện chỉ phục vụ `CANDIDATE` và `EMPLOYER`; user `ADMIN` được redirect về `/`.
   - Các endpoint `ADMIN` backend vẫn giữ để dùng cho UI/admin panel sau.
