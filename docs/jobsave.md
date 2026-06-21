# Trang Việc Làm Đã Lưu (`/candidate/saved`)

> **Cập nhật:** 21/06/2026  
> **File:** `web/src/app/candidate/saved/page.tsx`

---

## Tổng quan thay đổi

Trang `/candidate/saved` đã được **viết lại hoàn toàn** từ một giao diện đơn giản (grid 2 cột, không có filter) thành một trang quản lý việc làm đã lưu đầy đủ tính năng, theo đúng thiết kế UI mới.

---

## Tính năng mới

### 1. Header với thông tin tổng quan
- Nút **← Quay lại** (`router.back()`)
- Tiêu đề "Việc làm đã lưu" + **badge đếm** tổng số việc

### 2. Tabs lọc theo loại hình công việc
- Tự động sinh tab từ data thực tế (chỉ hiện tab nếu có data)
- `Tất cả (N)`, `Full-time (N)`, `Part-time (N)`, `Remote (N)`...
- Active tab được highlight bằng màu `bg-primary`

### 3. Toggle List / Grid view
- Nút ☰ (list) và ⊞ (grid) ở góc phải
- List view: thông tin đầy đủ theo hàng ngang
- Grid view: card 2 cột compact

### 4. Tìm kiếm realtime
- Input tìm theo: tên job, tên công ty, địa chỉ
- Placeholder: "Tìm trong danh sách đã lưu..."

### 5. Sắp xếp
- Dropdown: **Lưu mới nhất** / Lưu cũ nhất / Hạn sắp gần
- Sort "Hạn sắp gần" ưu tiên job sắp hết hạn lên đầu

### 6. Banner cảnh báo hết hạn
- Hiển thị khi có **≥ 1 việc làm sắp hết hạn trong 7 ngày**
- Màu amber warning: `⚠️ N việc làm sắp hết hạn...`

### 7. Card job chi tiết
- **Avatar initials** công ty (2 chữ cái đầu)
- Tên job + link đến `/jobs/[slug]`
- Tên công ty + địa chỉ (`addressDetail`)
- Badges: loại hình (`type`) / mức lương / cấp độ (`level`) / kinh nghiệm (`experience`)
- **Deadline badge** màu đỏ (≤ 7 ngày) / xanh (> 7 ngày)
- Footer: `Đã lưu X trước • HH: DD/MM/YYYY`
- Nút **Bỏ lưu** (DELETE `/api/v1/saved/jobs/:id`, xóa ngay khỏi list)
- Nút **Ứng tuyển** (link đến trang job)

### 8. Responsive theo theme
- Toàn bộ màu sắc dùng Tailwind semantic classes
- Tự động đổi màu khi toggle **Light / Dark / System** từ nút header

---

## Sửa lỗi field name (Prisma schema)

Các field trong Prisma schema có tên khác với interface ban đầu:

| Interface cũ (sai) | Prisma field thực tế | Ghi chú |
|---|---|---|
| `jobType` | `type` | `JobType` enum |
| `location` | `addressDetail` | Địa chỉ chi tiết |
| `experienceLevel` | `experience` | `ExperienceLevel` enum |

---

## Files liên quan đã thay đổi

| File | Thay đổi |
|---|---|
| `web/src/app/candidate/saved/page.tsx` | Viết lại hoàn toàn |
| `web/src/components/common/Header.tsx` | Fix nút theme toggle hiển thị icon đúng theo `theme` state |
| `web/package.json` | Thêm `-p 3001` để Next.js luôn chạy trên port 3001 |
| `web/.env` | Tạo file env riêng cho web (Next.js chỉ đọc từ thư mục của nó) |
| `backend/.env` | Đổi `localhost` → `127.0.0.1` cho `DATABASE_URL` và `REDIS_URL` |

---

## API Endpoint

```
GET /api/v1/saved/jobs?limit=100
```

**Response shape:**
```json
{
  "data": {
    "items": [
      {
        "id": "...",
        "createdAt": "2026-06-18T...",
        "job": {
          "id": "...",
          "title": "Quản Lý Tiền Sảnh",
          "slug": "quan-ly-tien-sanh",
          "type": "FULL_TIME",
          "salaryMin": 15000000,
          "salaryMax": 25000000,
          "addressDetail": "Gành Dầu, Phú Quốc",
          "level": "SENIOR",
          "experience": "THREE_TO_FIVE_YEARS",
          "deadline": "2026-05-31T...",
          "company": { "name": "Vinpearl Resort Phú Quốc" }
        }
      }
    ]
  }
}
```

**Bỏ lưu:**
```
DELETE /api/v1/saved/jobs/:savedJobId
```

---

## Cổng chạy dev

| Service | Cổng |
|---|---|
| Next.js web | `3001` (cố định bằng `-p 3001`) |
| NestJS backend | `3000` |
| PostgreSQL (Docker) | `5435` |
| Redis (Docker) | `6381` |

> **Lưu ý:** Backend kết nối Docker phải dùng `127.0.0.1` thay vì `localhost` do DNS resolution trên Windows.
