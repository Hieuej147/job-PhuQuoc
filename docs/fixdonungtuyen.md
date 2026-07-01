# Tài Liệu Cập Nhật Trang Đơn Ứng Tuyển Candidate

> Ngày: 2026-06-22  
> Người thực hiện: Antigravity AI

---

## 1. Yêu cầu sửa đổi
1. Thêm bộ lọc (filter) trên trang danh sách đơn ứng tuyển của ứng viên (candidate).
2. Hiển thị trạng thái đơn ứng tuyển rõ ràng và đồng bộ:
   * Khi mới ứng tuyển (trạng thái `PENDING`) -> Hiển thị **"Đã nộp"**.
   * Khi nhà tuyển dụng duyệt đơn (trạng thái `ACCEPTED`) -> Hiển thị **"Đã duyệt"**.
   * Khi nhà tuyển dụng từ chối đơn (trạng thái `REJECTED`) -> Hiển thị **"Từ chối"**.
3. Đảm bảo giữ nguyên vẹn module Inngest để việc gửi sự kiện và bắn thông báo (notification) hoạt động bình thường.

---

## 2. Chi tiết các thay đổi

### File sửa đổi:
* [page.tsx](file:///c:/Users/ngoan/Documents/thuctapsinh/job-PhuQuoc/web/src/app/candidate/applications/page.tsx)

### Chi tiết logic đã cập nhật:

#### 1. Định nghĩa lại Map Trạng thái (Status Map)
Cập nhật nhãn (label) tiếng Việt trực quan, kèm màu sắc và icon tương ứng để tăng trải nghiệm người dùng (Rich Aesthetics):
```typescript
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; colorClass: string }> = {
  PENDING: { 
    label: "Đã nộp", 
    variant: "secondary", 
    icon: Clock,
    colorClass: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900" 
  },
  REVIEWING: { 
    label: "Đang xem xét", 
    variant: "outline", 
    icon: AlertCircle,
    colorClass: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900" 
  },
  ACCEPTED: { 
    label: "Đã duyệt", 
    variant: "default", 
    icon: CheckCircle2,
    colorClass: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" 
  },
  REJECTED: { 
    label: "Từ chối", 
    variant: "destructive", 
    icon: XCircle,
    colorClass: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900" 
  },
};
```

#### 2. Thêm bộ lọc theo trạng thái (Status Filter Tabs)
* Sử dụng `useMemo` để tính toán số lượng đơn của từng trạng thái theo thời gian thực (real-time badge count).
* Tạo danh sách tabs có hiệu ứng hover/active sinh động và phù hợp với theme màu chủ đạo `#005a71`.
* Khi click vào mỗi tab, ứng dụng sẽ lọc danh sách đơn ứng tuyển một cách nhanh chóng (client-side filtering) không cần reload trang.

#### 3. Thêm bộ lọc tìm kiếm (Search Input)
* Hỗ trợ tìm kiếm theo tiêu đề công việc hoặc tên công ty, đặc biệt hữu ích khi ứng viên nộp nhiều công việc.

#### 4. Bảo toàn Inngest Module
* Các sự kiện nộp đơn, duyệt đơn và từ chối đơn vẫn được xử lý qua Inngest ở backend để gửi thông báo đến người dùng. Frontend chỉ đọc dữ liệu trạng thái từ API trả về, hoàn toàn không can thiệp hay xóa bất kỳ logic gửi event nào.

---

## 3. Hướng dẫn kiểm thử (Checklist)

- [x] Truy cập `/candidate/applications`, trang tải dữ liệu mượt mà, hiển thị đúng danh sách đơn ứng tuyển hiện tại.
- [x] Kiểm tra hiển thị trạng thái:
  - Trạng thái `PENDING` hiển thị là **"Đã nộp"**.
  - Trạng thái `ACCEPTED` hiển thị là **"Đã duyệt"**.
  - Trạng thái `REJECTED` hiển thị là **"Từ chối"**.
- [x] Click các nút filter (Tất cả, Đã nộp, Đang xem xét, Đã duyệt, Từ chối) hoạt động chính xác, cập nhật đúng danh sách và số lượng đếm trên badge.
- [x] Ô tìm kiếm hoạt động bình thường, hỗ trợ lọc nhanh theo từ khóa tiêu đề hoặc công ty.
