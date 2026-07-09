# FE Refactor Handoff

## Mục tiêu

Tách các page còn dài thành feature modules để page chỉ còn composition, dễ review và dễ giao việc. Không refactor auth trong file này vì auth register đã được xử lý riêng.

## Đã dọn trong lượt lib/query cleanup

- Mở rộng `web/src/lib/api-client.ts` thành helper fetch dùng chung: `apiRequest`, `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `unwrapApiPayload`, `ApiError`.
- Chuyển chat application sang TanStack Query tại `web/src/features/applications/hooks/use-application-chat.ts`; polling 3 giây chỉ chạy khi dialog mở, gửi tin dùng optimistic update.
- Chuyển logic register/verify riêng về `web/src/features/auth-register/api.ts`; `lib` không còn giữ helper chỉ phục vụ auth register.
- Đổi `web/src/lib/dashboard-api.ts` thành `web/src/lib/dashboard-queries.ts` để đúng ý nghĩa TanStack Query hooks.
- Gộp notification href/icon vào `web/src/lib/notifications.ts`; bỏ file icon rời trong `lib/utils`.
- Dùng lại helper shared `timeAgo`, `formatSalary`, `jobTypeLabel`, `companyInitials` ở các page/card rõ ràng thay vì tự định nghĩa lặp.

Rule mới:

- `web/src/lib` chỉ giữ core/shared helper dùng nhiều domain.
- Query/hook theo nghiệp vụ đặt trong `web/src/features/*`.
- Khi gọi API mới, ưu tiên dùng `api-client.ts`; chỉ tự `fetch` khi có lý do riêng như route handler server-side, auth SDK flow, hoặc upload FormData cần xử lý đặc biệt.

## Page ưu tiên

1. `web/src/app/(main)/jobs/[slug]/JobDetailClient.tsx`
   - Tách apply modal, hooks `useJobApply`, `useSavedJobState`.
   - Tách mapper job detail sang `features/job-detail/utils`.

2. `web/src/app/candidate/saved/page.tsx`
   - Tách card saved job, toolbar/filter, hook fetch/unsave.
   - Giữ logic job hết hạn: dashboard có thể ẩn, saved page vẫn hiển thị trạng thái hết hạn.

3. `web/src/app/candidate/profile/page.tsx`
   - Tách section profile, avatar upload, completion checklist.
   - Dùng chung helper completion hiện có.

4. `web/src/app/(main)/jobs/JobsPageClient.tsx`
   - Tách search/filter state, saved ids state, job list section.
   - Không đổi public jobs behavior trong lần refactor.

5. `web/src/app/candidate/saved-companies/page.tsx`
   - Tách company card, fetch hook, unfollow confirm/toast.

6. Component lớn nên xem sau:
   - `web/src/components/common/Header.tsx`
   - `web/src/components/jobs/JobFilter.tsx`
   - `web/src/components/blog/BlogDetailClient.tsx`
   - `web/src/components/blog/BlogPageClient.tsx`

## Còn nên dọn tiếp

- `web/src/app/employer/company/page.tsx`: còn tự parse response cho upload logo/company update; nên tách thành `features/employer-company/hooks` hoặc API helper riêng cho FormData.
- `web/src/lib/auth.ts`: vẫn là wrapper auth flow dùng nhiều màn hình; có thể giữ trong `lib` hoặc tách tiếp thành `features/auth` nếu team muốn gom toàn bộ auth theo feature.
- `web/src/app/api/copilotkit/[[...slug]]/route.ts` và `web/src/lib/server-auth.ts`: đang chạy ở server/route handler nên không ép dùng client helper.
- `web/src/features/employer-applications/utils.ts`: còn `getInitials` riêng cho applicant avatar; chỉ nên thay nếu thống nhất dùng chung avatar initial toàn app.

## Pattern đề xuất

Mỗi domain dùng:

```txt
web/src/features/<domain>/
  components/
  hooks/
  types.ts
  utils.ts
```

Quy tắc:

- Page route chỉ lấy params/searchParams và render component.
- Fetch/state đặt trong hook.
- Mapping API response đặt ở utils.
- UI section/card/dialog đặt trong components.
- Dùng Sonner toast, không dùng `alert/prompt`.

## Verification

- `pnpm --dir web exec tsc --noEmit`
- `pnpm --dir web build`
- Test manual route đã refactor.
- Không đổi API contract khi chỉ refactor.
