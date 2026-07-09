# Backup Fix: Resume Template Print & Data Mapping

Ngày ghi chú: 2026-07-07

## Mục tiêu

Ghi lại các thay đổi trong lần sửa lỗi tạo CV/export CV để gửi team review trước khi merge.

## Lỗi đã xử lý

### 1. Runtime khi tạo CV mới

Lỗi:

```text
Runtime TypeError: resumeData.socialLinks.map is not a function
```

Nguyên nhân:

- Một số dữ liệu profile lưu `socialLinks` dạng object, ví dụ:

```ts
{
  facebook: "http://localhost:...",
  linkedin: "http://localhost:...",
  github: "http://localhost:...",
  website: "http://localhost:..."
}
```

- Template CV lại cần dạng array để `.map()`:

```ts
[
  { platform: "facebook", url: "http://localhost:..." }
]
```

Cách sửa:

- Sửa mapper chung ở `web/src/lib/resume-template-data.ts`.
- Thêm helper `toSocialLinks()`:
  - nếu input là array thì giữ nguyên;
  - nếu input là object thì convert sang array `{ platform, url }`;
  - nếu input sai format/null/string thì trả `[]`.
- Thêm helper `toArray()` để ép an toàn các field JSON khác:
  - `education`
  - `experience`
  - `projects`

## File đã sửa chính

```text
web/src/lib/resume-template-data.ts
web/src/template/TemplateModern.tsx
```

## Chi tiết thay đổi

### `resume-template-data.ts`

Mục đích:

- Đồng bộ dữ liệu trước khi truyền vào template CV.
- Tránh lỗi runtime khi template gọi `.map()` trên dữ liệu không phải array.

Các field được normalize:

```text
socialLinks -> luôn là array
education   -> luôn là array
experience  -> luôn là array
projects    -> luôn là array
```

### `TemplateModern.tsx`

Mục đích:

- Sửa lỗi export PDF bị tách thành 2 trang không hợp lý.

Nguyên nhân:

- CSS print trước đó dùng `break-inside: avoid` trên cả section `.cv-modern-block`.
- Browser cố giữ nguyên section "Dự án nổi bật", nên nếu còn ít chỗ sẽ đẩy cả section sang trang 2.

Cách sửa:

- Chỉ giữ `break-inside: avoid` cho từng card nhỏ.
- Cho section `.cv-modern-block` flow bình thường.
- Giảm spacing/padding khi print:
  - giảm padding header/body;
  - giảm gap giữa section;
  - giảm gap project grid;
  - giảm size avatar khi print;
  - giảm padding card khi print.

## Verification đã chạy

```bash
pnpm --dir web exec tsc --noEmit
pnpm --dir web build
```

Kết quả:

```text
Typecheck: pass
Web build: pass
```

## Lưu ý cho team

- Lỗi không nằm ở riêng `TemplateClassic`, mà do dữ liệu `socialLinks` không thống nhất shape.
- Fix đúng nên đặt ở mapper chung `resume-template-data.ts`, để tất cả template dùng cùng một format.
- Nếu thêm template mới, nên nhận data từ mapper chung thay vì tự đọc trực tiếp JSON thô từ API.
- Nếu export PDF vẫn thấy cache cũ, cần hard reload hoặc restart dev server.

