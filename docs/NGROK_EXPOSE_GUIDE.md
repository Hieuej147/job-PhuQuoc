# 🌍 Hướng dẫn Expose PQ Jobs ra Internet qua Ngrok

> Tài liệu này hướng dẫn cách expose toàn bộ hệ thống PQ Jobs (frontend + backend) ra internet qua **ngrok** để người khác có thể truy cập và test từ xa.

---

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Yêu cầu](#yêu-cầu)
- [Cách 1: Dùng script tự động](#cách-1-dùng-script-tự-động-khuyến-nghị)
- [Cách 2: Cấu hình thủ công](#cách-2-cấu-hình-thủ-công)
- [Cập nhật Google OAuth](#cập-nhật-google-oauth-cho-google-login)
- [Khôi phục localhost](#khôi-phục-về-localhost)
- [Xử lý sự cố](#xử-lý-sự-cố)

---

## Tổng quan kiến trúc

Khi expose ra internet, hệ thống hoạt động theo mô hình sau:

```
Browser (người test từ xa)
    │
    ▼
ngrok HTTPS  (vd: https://abc-xyz.ngrok-free.dev)
    │
    ▼
┌─────────────────── Nginx localhost:80 ───────────────────┐
│                                                          │
│   /api/v1/*          →  backend  :3006  (NestJS API)     │
│   /api/auth/*        →  backend  :3006  (Better Auth)    │
│   /socket.io/*       →  backend  :3006  (WebSocket)      │
│   /api/copilotkit/*  →  frontend :3001  (CopilotKit)     │
│   /*                 →  frontend :3001  (Next.js)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Tại sao cần Nginx?**

- Ngrok chỉ expose **1 port**. Hệ thống có **2 port** (frontend 3001 + backend 3006).
- Nginx đóng vai trò **reverse proxy gateway**, gộp cả hai vào port 80.
- Ngrok expose port 80 → tất cả request đều đi qua 1 URL duy nhất.

---

## Yêu cầu

- **ngrok** đã cài đặt và đăng nhập (`ngrok config add-authtoken <token>`)
- **Nginx** đã cài và đang chạy trên port 80
- **PM2** đang chạy backend + frontend

Kiểm tra nhanh:

```bash
# Kiểm tra nginx
sudo systemctl status nginx

# Kiểm tra PM2
pm2 status

# Kiểm tra ngrok
ngrok version
```

---

## Cách 1: Dùng script tự động (khuyến nghị)

### Bước 1: Khởi động ngrok

```bash
ngrok http 80
```

> ⚠️ **QUAN TRỌNG**: Phải expose port **80** (nginx), KHÔNG phải 3001 (frontend).

Ngrok sẽ hiển thị URL public, ví dụ:

```
Forwarding  https://abc-xyz.ngrok-free.dev -> http://localhost:80
```

### Bước 2: Chạy script expose

Mở **terminal mới** (giữ ngrok chạy ở terminal cũ):

```bash
# Tự động detect URL ngrok
./scripts/ngrok-expose.sh

# Hoặc truyền URL trực tiếp
./scripts/ngrok-expose.sh https://abc-xyz.ngrok-free.dev
```

Script sẽ tự động:
1. ✅ Backup `.env` files (lưu vào `.env.local-backup`)
2. ✅ Cập nhật `backend/.env` (BETTER_AUTH_URL, FRONTEND_URL, GOOGLE_CALLBACK_URL)
3. ✅ Cập nhật `web/.env` (xoá NEXT_PUBLIC_API_URL, set NEXT_PUBLIC_SITE_URL)
4. ✅ Reload nginx
5. ✅ Restart PM2 (backend + frontend)

### Bước 3: Reload nginx (nếu script báo lỗi sudo)

Nếu script không reload được nginx (cần sudo password):

```bash
sudo nginx -s reload
```

### Bước 4: Gửi URL cho bạn

Gửi URL ngrok cho bạn bè để test:

```
https://abc-xyz.ngrok-free.dev
```

> 💡 Ngrok free sẽ hiển thị trang **"Visit Site"** lần đầu. Bấm nút để tiếp tục.

---

## Cách 2: Cấu hình thủ công

Nếu không muốn dùng script, thực hiện các bước sau:

### 2.1 Khởi động ngrok

```bash
ngrok http 80
```

Ghi lại URL, ví dụ: `https://abc-xyz.ngrok-free.dev`

### 2.2 Sửa `backend/.env`

```env
# Thay đổi 3 dòng này (thay URL ngrok của bạn):
BETTER_AUTH_URL="https://abc-xyz.ngrok-free.dev"
FRONTEND_URL="https://abc-xyz.ngrok-free.dev"
GOOGLE_CALLBACK_URL="https://abc-xyz.ngrok-free.dev/api/auth/callback/google"
```

### 2.3 Sửa `web/.env`

```env
# Xoá giá trị để dùng same-origin (qua nginx):
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_REALTIME_URL=

# Thêm/sửa URL site:
NEXT_PUBLIC_SITE_URL=https://abc-xyz.ngrok-free.dev
```

### 2.4 Reload nginx và restart PM2

```bash
sudo nginx -s reload
pm2 restart backend frontend --update-env
```

---

## Cập nhật Google OAuth (cho Google Login)

Nếu cần đăng nhập bằng Google, phải cập nhật trên **Google Cloud Console**:

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Chọn project → **APIs & Services** → **Credentials**
3. Click vào **OAuth 2.0 Client ID** đang dùng
4. Thêm/sửa:

| Trường | Giá trị |
|---|---|
| Authorized JavaScript origins | `https://abc-xyz.ngrok-free.dev` |
| Authorized redirect URIs | `https://abc-xyz.ngrok-free.dev/api/auth/callback/google` |

> ⚠️ URL phải khớp **tuyệt đối** (bao gồm cả https). Thay `abc-xyz` bằng URL ngrok thực tế.

---

## Khôi phục về localhost

Khi test xong, chạy:

```bash
./scripts/ngrok-expose.sh --stop
```

Script sẽ tự động:
1. Restore `.env` files từ backup
2. Restart PM2

Hoặc khôi phục thủ công:

```bash
# Restore từ backup
cp backend/.env.local-backup backend/.env
cp web/.env.local-backup web/.env

# Restart
pm2 restart backend frontend --update-env
```

---

## Xử lý sự cố

### ❌ Lỗi "Mixed Content" hoặc API không gọi được

**Nguyên nhân**: Ngrok đang expose port 3001 thay vì 80.

**Giải pháp**:
```bash
# Tắt ngrok cũ (Ctrl+C), chạy lại đúng port:
ngrok http 80
```

### ❌ Login thất bại / redirect sai

**Nguyên nhân**: `BETTER_AUTH_URL` hoặc `FRONTEND_URL` chưa được cập nhật.

**Giải pháp**: Kiểm tra env:
```bash
grep -E "BETTER_AUTH_URL|FRONTEND_URL" backend/.env
grep "NEXT_PUBLIC_API_URL" web/.env
```

Đảm bảo trỏ về URL ngrok, rồi restart:
```bash
pm2 restart backend frontend --update-env
```

### ❌ Google OAuth callback lỗi

**Nguyên nhân**: Redirect URI trên Google Console không khớp.

**Giải pháp**: Kiểm tra URL trong Google Cloud Console phải **giống hệt** `GOOGLE_CALLBACK_URL` trong `backend/.env`.

### ❌ Trang trắng / 502 Bad Gateway

**Nguyên nhân**: Frontend hoặc backend chưa khởi động xong.

**Giải pháp**:
```bash
# Kiểm tra status
pm2 status

# Xem log
pm2 logs frontend --lines 20
pm2 logs backend --lines 20
```

### ❌ URL ngrok thay đổi sau khi restart

Ngrok free plan sẽ tạo URL mới mỗi lần khởi động. Cần chạy lại script:

```bash
ngrok http 80
# Terminal mới:
./scripts/ngrok-expose.sh   # tự detect URL mới
```

> 💡 **Tip**: Dùng [ngrok domain cố định](https://dashboard.ngrok.com/domains) (free plan được 1 domain):
> ```bash
> ngrok http 80 --domain=your-name.ngrok-free.dev
> ```

---

## Tóm tắt nhanh

```bash
# === BẬT (expose ra internet) ===
ngrok http 80                        # Terminal 1
./scripts/ngrok-expose.sh            # Terminal 2
sudo nginx -s reload                 # Nếu script báo lỗi sudo

# === TẮT (khôi phục localhost) ===
# Ctrl+C ngrok
./scripts/ngrok-expose.sh --stop
```
