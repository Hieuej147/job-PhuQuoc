# Hướng dẫn sử dụng Scalar API Docs

## Truy cập

Sau khi khởi động backend, truy cập: **http://localhost:3000/docs**

## Đăng nhập trong Scalar

Scalar UI cần session cookie để test các endpoint yêu cầu auth.

### Bước 1: Đăng nhập

1. Mở Scalar docs tại `http://localhost:3000/docs`
2. Tìm endpoint `POST /api/v1/scalar-auth/login`
3. Click "Try it"
4. Nhập body:
```json
{
  "email": "candidate@phuquoc.jobs",
  "password": "Candidate123!"
}
```
5. Click "Send"
6. Session cookie sẽ được tự động set

### Bước 2: Test endpoints

Sau khi đăng nhập, tất cả các endpoint đều có thể test được. Cookie sẽ được tự động gửi kèm.

### Bước 3: Đăng xuất

Tìm endpoint `POST /api/v1/scalar-auth/logout` và gọi nó.

## Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Candidate | `candidate@phuquoc.jobs` | `Candidate123!` |
| Employer | `employer@phuquoc.jobs` | `Employer123!` |

## Lưu ý

- Scalar docs hiển thị tất cả endpoints, bao gồm cả public và authenticated
- Endpoint nào yêu cầu auth sẽ trả 401 nếu chưa đăng nhập
- Session cookie có thời hạn, cần đăng nhập lại nếu hết hạn
- Để test endpoint với role khác, đăng xuất rồi đăng nhập lại với tài khoản khác
