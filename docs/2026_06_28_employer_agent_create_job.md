# Phát triển Employer Agent: Tính năng Hỗ trợ Đăng Tin Tuyển Dụng

**Ngày thực hiện:** 2026-06-28  
**Người thực hiện:** Võ Thành Phú  
**Nhiệm vụ:** Phát triển tính năng "hỗ trợ đăng tin" cho Employer Agent (giao bởi nhóm trưởng)

---

## 1. Làm gì?

Thêm tính năng hỗ trợ đăng tin tuyển dụng cho Recruiter Agent (Employer Agent).

Nhà tuyển dụng có thể chat với AI để tạo tin tuyển dụng mà không cần tự điền form thủ công. AI sẽ hướng dẫn từng bước, thu thập đủ thông tin, xác nhận lại rồi mới tạo tin.

**Flow hoàn chỉnh:**
```
Employer: "Tôi muốn đăng tin tuyển dụng"
         ↓
AI gọi get_categories → hiện danh mục thật từ DB
         ↓
AI hỏi chọn danh mục
         ↓
AI hỏi lần lượt: tiêu đề, mô tả, loại hình, lương,
kinh nghiệm, cấp bậc, số lượng, hạn nộp
         ↓
AI tóm tắt + hỏi xác nhận
         ↓
AI gọi create_job → POST /api/v1/jobs → Job DRAFT
         ↓
AI thông báo thành công + hướng dẫn thanh toán
```

---

## 2. Tại sao?

Nhóm trưởng giao thêm nhiệm vụ: Employer Agent cần hỗ trợ đăng tin tuyển dụng.

Recruiter Agent trước đó chỉ có 4 tools (xem ứng viên, xếp hạng, cập nhật trạng thái, soạn email) — chưa có khả năng tạo tin tuyển dụng mới.

Việc thêm tính năng này giúp nhà tuyển dụng:
- Không cần tự điền form thủ công
- AI hỗ trợ thu thập đủ thông tin cần thiết
- Giảm sai sót khi tạo tin (AI xác nhận lại trước khi tạo)

---

## 3. Sửa như thế nào?

### Quyết định thiết kế quan trọng

Cần `category_id` hợp lệ khi tạo job, nhưng ID trong DB là dạng `cuid` (ví dụ `cat_fnb`) — không thể hardcode vào prompt. Do đó chọn **cách tối ưu**: thêm tool `get_categories` để AI tự tra cứu danh mục thật từ DB thay vì hardcode.

### 3.1 Tạo file mới: `tools/recruiter/get_categories.py`

Tool lấy danh sách danh mục ngành nghề từ API `/categories`. AI gọi tool này trước khi tạo tin để lấy `category_id` hợp lệ.

### 3.2 Tạo file mới: `tools/recruiter/create_job.py`

Tool tạo tin tuyển dụng mới qua API `POST /api/v1/jobs`.

**Tham số bắt buộc:** `title`, `description`, `category_id`, `type`

**Tham số tùy chọn:** `experience`, `level`, `salary_min`, `salary_max`, `requirements`, `benefits`, `quantity`, `deadline`

Job được tạo ở trạng thái `DRAFT` — cần thanh toán để kích hoạt (đúng flow nghiệp vụ của hệ thống).

### 3.3 Cập nhật `agents/recruiter_agent.py`

Thêm import và đăng ký 2 tool mới vào `_register_tools()`:
```python
from tools.recruiter.get_categories import GetCategoriesTool
from tools.recruiter.create_job import CreateJobTool

# Trong _register_tools():
GetCategoriesTool(api_client=self.api_client),
CreateJobTool(api_client=self.api_client),
```

### 3.4 Cập nhật `RECRUITER_SYSTEM_PROMPT` trong `core/prompts.py`

Thêm hướng dẫn quy trình đăng tin 6 bước vào system prompt để AI biết cách dẫn dắt cuộc hội thoại đúng flow.

---

## 4. Lỗi gì? (trong quá trình phát triển)

Không có lỗi phát sinh — thiết kế flow và code đúng ngay từ đầu nhờ phân tích kỹ trước khi viết code.

---

## 5. Thiếu gì? (chưa làm trong lần này)

- **Chưa có renderer UI** cho kết quả tạo job (hiện tại chỉ hiện text) — có thể thêm card hiển thị thông tin job vừa tạo kèm link đến trang thanh toán
- **Chưa hỗ trợ chỉnh sửa job DRAFT** qua chat (ví dụ: "Tôi muốn đổi lương thành 10-15 triệu")
- **Chưa hỗ trợ địa điểm** (`wardId`) — cần thêm tool `get_wards` tương tự `get_categories`
- **Chưa hỗ trợ yêu cầu và phúc lợi chi tiết** — AI hiện nhận text thô, chưa có format chuẩn
- **Chưa test edge case**: nhà tuyển dụng chưa có công ty (sẽ bị lỗi 404 từ NestJS)

---

## 6. Đã khắc phục như thế nào?

**Kết quả cuối cùng sau khi hoàn thành:**
- ✅ AI tự động gọi `get_categories` khi employer muốn đăng tin
- ✅ Hiện đúng danh sách danh mục thật từ DB (8 danh mục)
- ✅ AI hỏi đủ 8 thông tin cần thiết
- ✅ AI tóm tắt và xác nhận trước khi tạo
- ✅ Tool `create_job` gọi API thành công, job được tạo trong DB với status `DRAFT`
- ✅ AI thông báo rõ ràng và hướng dẫn bước tiếp theo (thanh toán)

**Test case đã thực hiện:**
- Employer chat "Tôi muốn đăng tin tuyển dụng"
- Chọn danh mục "Nhà hàng - Khách sạn"
- Điền thông tin: Lễ tân khách sạn 5 sao, FULL_TIME, 8-12 triệu, UNDER_1_YEAR, FRESHER, 2 người, deadline 2026-07-31
- AI tóm tắt → xác nhận → tạo thành công → job xuất hiện trong "Quản lý tin đăng"

---

## Ghi chú kỹ thuật

**Phân quyền:** Recruiter Agent chỉ hoạt động trên trang `employer/dashboard`. Mọi API call đều kèm cookie session, NestJS verify role `EMPLOYER` trước khi cho phép tạo job.

**Trạng thái job sau khi tạo:** `DRAFT` — đúng với flow nghiệp vụ: Employer tạo job → thanh toán → job chuyển sang `ACTIVE` và xuất hiện công khai.

---

*Nếu cần giải thích thêm, liên hệ Võ Thành Phú hoặc xem thêm tại `TEAM_FE_DOCUMENT.md`*