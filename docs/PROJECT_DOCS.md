# Phú Quốc Jobs — Project Documentation

> Tài liệu kỹ thuật toàn diện cho dự án PQJobs — nền tảng tuyển dụng đảo Phú Quốc.
> Cập nhật: 10/06/2026

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Database Schema](#3-database-schema)
4. [Backend API Endpoints](#4-backend-api-endpoints)
5. [Frontend Routes & Components](#5-frontend-routes--components)
6. [AI Agent Architecture](#6-ai-agent-architecture)
7. [Authentication Flow](#7-authentication-flow)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Event System (Inngest)](#9-event-system-inngest)
10. [Caching Strategy](#10-caching-strategy)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Security & Known Issues](#12-security--known-issues)
13. [Development Commands](#13-development-commands)
14. [File Inventory](#14-file-inventory)

---

## 1. Tổng quan dự án

### 1.1 Mục tiêu

**Phú Quốc Jobs** là job board platform dành cho đảo Phú Quốc, Việt Nam. Giai đoạn 1 tập trung hoàn thiện backend API + AI agent. Frontend team sẽ đọc Scalar docs và tích hợp sau.

### 1.2 Đối tượng người dùng

| Vai trò | Mô tả |
|---------|-------|
| **CANDIDATE** | Người tìm việc — tạo CV, tìm kiếm việc làm, nộp đơn ứng tuyển |
| **EMPLOYER** | Nhà tuyển dụng — đăng tin tuyển dụng, quản lý đơn ứng tuyển, thanh toán |
| **ADMIN** | Quản trị viên — quản lý người dùng, danh mục, blog, audit |

### 1.3 Tech Stack tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                    │
│  React 19 + TailwindCSS 4 + shadcn/ui + CopilotKit 1.57       │
│  Port: 3001                                                     │
├─────────────────────────────────────────────────────────────────┤
│                        AI AGENT (Python)                         │
│  FastAPI + LangGraph + LangChain + OpenAI GPT-4o-mini           │
│  Port: 8125                                                     │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND (NestJS 11)                       │
│  TypeScript 5.7 + Prisma 6 + better-auth + Inngest + Stripe     │
│  Port: 3000                                                     │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  PostgreSQL 16 (port 5435) + Redis 7 (port 6381)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc tổng thể

### 2.1 Sơ đồ kiến trúc

```
                          ┌──────────────┐
                          │   Browser     │
                          │  (User/FE)    │
                          └──────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Next.js Frontend      │
                    │      (port 3001)        │
                    │                         │
                    │  SSR pages (public)     │
                    │  CSR pages (dashboard)  │
                    │  BFF Proxy routes       │
                    └──┬──────┬──────┬───────┘
                       │      │      │
          ┌────────────┘      │      └────────────┐
          ▼                   ▼                    ▼
  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐
  │  /api/auth/*  │  │  /api/v1/*    │  │ /api/copilotkit │
  │  (Auth proxy) │  │  (API proxy)  │  │ (CopilotKit RT) │
  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘
          │                  │                    │
          ▼                  ▼                    ▼
  ┌───────────────────────────────┐    ┌──────────────────┐
  │     NestJS Backend            │    │  Python AI Agent  │
  │        (port 3000)            │    │    (port 8125)    │
  │                               │    │                   │
  │  Auth → Roles → Controller    │    │  LangGraph Agent  │
  │  Prisma → PostgreSQL          │    │  8 tools          │
  │  ioredis → Redis              │    │  AG-UI protocol   │
  │  Inngest → Async events       │    │                   │
  └───────────┬───────────────────┘    └────────┬──────────┘
              │                                  │
              │         ┌────────────────────────┘
              │         │  Agent tools gọi qua BFF proxy
              ▼         ▼
  ┌───────────────────────────────┐
  │      PostgreSQL 16            │
  │       (port 5435)             │
  ├───────────────────────────────┤
  │       Redis 7                 │
  │       (port 6381)             │
  └───────────────────────────────┘
```

### 2.2 Monorepo Structure

```
job-phuquoc/
├── backend/                    # NestJS API (port 3000)
│   └── src/
│       ├── prisma/             # @Global PrismaService
│       ├── auth/               # better-auth config + guards
│       ├── common/             # cache, email, filters, interceptors
│       ├── inngest/            # event system
│       └── modules/            # 15 feature modules
├── web/                        # Next.js (port 3001) + Python Agent (port 8125)
│   ├── src/app/                # App Router pages + BFF proxy
│   ├── src/components/         # UI components
│   ├── src/features/ai/        # CopilotKit tools, renderers
│   ├── src/hooks/              # Custom hooks
│   └── agent/                  # Python FastAPI agent
│       ├── agents/             # CandidateAgent, RecruiterAgent
│       ├── tools/              # candidate/ và recruiter/ tools
│       └── core/               # config, prompts, api_client
├── docker/                     # Docker Compose cho infra
├── scripts/                    # Backup, seed scripts
├── ecosystem.config.js         # PM2
└── pnpm-workspace.yaml         # Monorepo config
```

### 2.3 Module Communication Rules

```
Cross-module async  →  Inngest events
Cross-module sync   →  SharedModule contracts (JobContract, CompanyContract, ...)
PrismaModule        →  @Global(), inject trực tiếp
KHÔNG import        →  Service của module khác trực tiếp
```

### 2.4 Guard Chain

```
Request
  → ThrottlerGuard (100 req/min, in-memory)
  → AuthGuard
     → @Public()? → bypass
     → Bearer token? → JWT verify via JWKS + DB check isActive/isLocked
     → Session cookie? → better-auth getSession() + isActive/isLocked check
     → Neither? → 401 Unauthorized
  → RolesGuard
     → No @Roles()? → allow all
     → Check user.role against required roles → 403 if mismatch
  → ValidationPipe (whitelist: true, transform: true)
  → Controller Handler
  → ResponseTransformInterceptor → { data, timestamp }
  → GlobalExceptionFilter (on error) → { statusCode, message, timestamp, path }
```

### 2.5 Response Format

```json
// Success (wrapped by interceptor)
{ "data": { ... }, "timestamp": "2026-06-10T..." }

// Paginated
{ "data": { "items": [...], "total": 100, "page": 1, "limit": 10, "totalPages": 10 }, "timestamp": "..." }

// Error (from filter)
{ "statusCode": 400, "message": "...", "timestamp": "...", "path": "/api/v1/..." }
```

---

## 3. Database Schema

### 3.1 Enums

```
Role              = CANDIDATE | EMPLOYER | ADMIN
CompanySize       = SIZE_1_50 | SIZE_51_200 | SIZE_201_500 | SIZE_500_PLUS
JobType           = FULL_TIME | PART_TIME | REMOTE | CONTRACT | INTERNSHIP | FREELANCE
ExperienceLevel   = NO_EXPERIENCE | UNDER_1_YEAR | ONE_TO_THREE_YEARS | THREE_TO_FIVE_YEARS | OVER_FIVE_YEARS
JobLevel          = INTERN | FRESHER | JUNIOR | MID | SENIOR | LEAD | MANAGER | DIRECTOR
JobStatus         = DRAFT | PENDING | ACTIVE | CLOSED
ApplicationStatus = PENDING | REVIEWING | ACCEPTED | REJECTED
NotificationType  = APPLICATION_RECEIVED | APPLICATION_ACCEPTED | APPLICATION_REJECTED | JOB_APPROVED | COMPANY_APPROVED | JOB_DEADLINE | SYSTEM
PaymentStatus     = PENDING | COMPLETED | FAILED | REFUNDED
BlogType          = NORMAL | LANDING_PAGE
```

### 3.2 ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BETTER-AUTH TABLES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐       ┌──────────┐       ┌──────────────┐                    │
│  │  user     │──1:N──│ account  │       │ verification │                    │
│  │          │       │          │       │              │                    │
│  │ id       │──1:N──│ userId   │       │ identifier   │                    │
│  │ name     │       │ provider │       │ value        │                    │
│  │ email    │       │ password │       │ expiresAt    │                    │
│  │ role?    │       └──────────┘       └──────────────┘                    │
│  │ phone?   │──1:N──┌──────────┐       ┌──────────────┐                    │
│  │ isActive │       │ session  │       │    jwks      │                    │
│  │ isLocked │       │          │       │              │                    │
│  └──────────┘       │ userId   │       │ publicKey    │                    │
│       │             │ token    │       │ privateKey   │                    │
│       │             │ expires  │       └──────────────┘                    │
│       │             └──────────┘                                            │
│       │                                                                     │
└───────│─────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N (user → business tables)
        │
┌───────▼─────────────────────────────────────────────────────────────────────┐
│                           BUSINESS TABLES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ company           │         │ job_category      │                         │
│  │                   │         │                   │                         │
│  │ id                │    ┌───▶│ id                │                         │
│  │ name              │    │    │ name              │                         │
│  │ slug (unique)     │    │    │ slug (unique)     │                         │
│  │ logo?             │    │    │ icon?             │                         │
│  │ website?          │    │    └──────────────────┘                         │
│  │ description?      │    │                                                 │
│  │ wardId? ──────────│────│──▶┌──────────────────┐                         │
│  │ addressDetail?    │    │    │ address_ward      │                         │
│  │ size?             │    │    │                   │                         │
│  │ industry?         │    │    │ id                │                         │
│  │ ownerId (unique)──│────│──▶│ name              │                         │
│  │ isApproved        │    │    │ districtId ──────│──▶ address_district     │
│  │ isActive          │    │    └──────────────────┘    └──▶ address_province│
│  └────────┬─────────┘    │                                                 │
│           │              │                                                 │
│           │ 1:N          │                                                 │
│           ▼              │                                                 │
│  ┌──────────────────┐    │                                                 │
│  │ job               │────┘                                                 │
│  │                   │                                                      │
│  │ id                │         ┌──────────────────┐                         │
│  │ title             │         │ job_application   │                         │
│  │ slug (unique)     │────1:N──▶│                   │                         │
│  │ description       │         │ id                │                         │
│  │ benefits?         │         │ userId ───────────│──▶ user                 │
│  │ requirements?     │         │ jobId             │                         │
│  │ quantity          │         │ cvUrl?            │                         │
│  │ salaryMin?        │         │ resumeId? ────────│──▶ candidate_resume     │
│  │ salaryMax?        │         │ coverLetter?      │                         │
│  │ wardId?           │         │ status            │                         │
│  │ type              │         │ isBookmarked      │                         │
│  │ experience?       │         │ @@unique(userId,  │                         │
│  │ level?            │         │   jobId)          │                         │
│  │ status            │         └──────────────────┘                         │
│  │ deadline?         │                                                      │
│  │ categoryId ───────│──▶ job_category                                      │
│  │ companyId ────────│──▶ company                                           │
│  └──────────────────┘                                                       │
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ candidate_resume  │         │ resume_template   │                         │
│  │                   │         │                   │                         │
│  │ id                │         │ id                │                         │
│  │ userId ───────────│──▶ user │ name              │                         │
│  │ title             │         │ description?      │                         │
│  │ address?          │         │ previewUrl?       │                         │
│  │ summary?          │         │ htmlTemplate      │                         │
│  │ socialLinks? (JSON│         │ cssTemplate       │                         │
│  │ education? (JSON) │         │ isPublic          │                         │
│  │ experience? (JSON)│         │ userId? ──────────│──▶ user                 │
│  │ projects? (JSON)  │         │ isActive          │                         │
│  │ skills? (String)  │         └──────────────────┘                         │
│  │ degree?           │                                                      │
│  │ languages?        │                                                      │
│  │ isDefault         │                                                      │
│  │ templateId ───────│──▶ resume_template                                   │
│  └──────────────────┘                                                       │
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ notification      │         │ blog_post         │                         │
│  │                   │         │                   │                         │
│  │ id                │         │ id                │                         │
│  │ userId ───────────│──▶ user │ title             │                         │
│  │ type              │         │ slug (unique)     │                         │
│  │ title             │         │ type              │                         │
│  │ content           │         │ content? (Text)   │                         │
│  │ refId?            │         │ landingContent?   │                         │
│  │ refType?          │         │ thumbnail?        │                         │
│  │ isRead            │         │ excerpt?          │                         │
│  └──────────────────┘         │ categoryId? ──────│──▶ blog_category        │
│                               │ authorId ─────────│──▶ user                 │
│  ┌──────────────────┐         │ views             │                         │
│  │ saved_job         │         │ isPublished       │                         │
│  │                   │         └──────────────────┘                         │
│  │ id                │                                                      │
│  │ userId ───────────│──▶ user  ┌──────────────────┐                         │
│  │ jobId ────────────│──▶ job   │ saved_company     │                         │
│  │ @@unique(userId,  │         │                   │                         │
│  │   jobId)          │         │ id                │                         │
│  └──────────────────┘         │ userId ───────────│──▶ user                 │
│                               │ companyId ────────│──▶ company              │
│  ┌──────────────────┐         │ @@unique(userId,  │                         │
│  │ pricing_package   │         │   companyId)      │                         │
│  │                   │         └──────────────────┘                         │
│  │ id                │                                                      │
│  │ name              │         ┌──────────────────┐                         │
│  │ days              │         │ blog_category     │                         │
│  │ price             │         │                   │                         │
│  │ isActive          │         │ id                │                         │
│  └────────┬─────────┘         │ name              │                         │
│           │                    │ slug (unique)     │                         │
│           │ 1:N                └──────────────────┘                         │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │ payment           │         ┌──────────────────┐                         │
│  │                   │         │ audit_log         │                         │
│  │ id                │         │                   │                         │
│  │ userId ───────────│──▶ user │ id                │                         │
│  │ jobId ────────────│──▶ job  │ action            │                         │
│  │ packageId ────────│──▶ pkgs │ entityType?       │                         │
│  │ amount            │         │ entityId?         │                         │
│  │ status            │         │ actorId?          │                         │
│  │ gateway           │         │ oldValue?         │                         │
│  │ gatewayRef?       │         │ newValue?         │                         │
│  │ completedAt?      │         │ metadata? (JSON)  │                         │
│  └──────────────────┘         └──────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Status Machines

#### Job Status Machine

```
DRAFT ──(chọn package + thanh toán)──▶ PENDING ──(payment success)──▶ ACTIVE ──(hết deadline)──▶ CLOSED
  │                                      │                               │
  │                                      │                               │
  └── Employer tạo job mới               └── Chờ thanh toán              └── Tự động đóng khi hết hạn
      (status mặc định)                       (tạo checkout session)          (Inngest job.expired)
```

#### Application Status Machine

```
                    ┌──▶ REVIEWING ──▶ ACCEPTED
                    │                    ▲
PENDING ────────────┤                    │
                    │                    │
                    └────────────────────┘──▶ REJECTED

Mô tả:
  PENDING    → REVIEWING : Employer đang xem xét
  PENDING    → ACCEPTED  : Employer chấp nhận trực tiếp
  PENDING    → REJECTED  : Employer từ chối trực tiếp
  REVIEWING  → ACCEPTED  : Sau khi xem xét, chấp nhận
  REVIEWING  → REJECTED  : Sau khi xem xét, từ chối
  ACCEPTED   (terminal)
  REJECTED   (terminal)
```

#### Payment Status Machine

```
PENDING ──(Stripe webhook / mock)──▶ COMPLETED
   │                                      │
   │                                      └── Job ACTIVE + set deadline
   └──▶ FAILED
   └──▶ REFUNDED
```

### 3.4 Address Hierarchy

```
AddressProvince (Kiên Giang)
  └── AddressDistrict (Phú Quốc)
       └── AddressWard (Dương Đông, An Thới, Cửa Cạn, Hàm Ninh)
```

---

## 4. Backend API Endpoints

> Prefix: `/api/v1` (trừ auth routes là `/api/auth`)
> Auth: Yêu cầu đăng nhập trừ `@Public()`
> Response: `{ data: T, timestamp }` cho success, `{ statusCode, message, path, timestamp }` cho error

### 4.1 Auth Module

#### CustomAuthController

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `POST` | `/auth/register-email` | Public | Any | `RegisterEmailDto` | Đăng ký email/password: user mới tạo account rồi xác nhận email, user OAuth cùng email thì gửi OTP xác nhận |
| `POST` | `/auth/complete-email-registration` | Public | Any | `CompleteEmailRegistrationDto` | Xác nhận OTP và hoàn tất credential account |
| `POST` | `/auth/request-password-reset` | Public | Any | `RequestPasswordResetDto` | Quên mật khẩu: tự phân luồng verify email / reset password / Google-only |
| `GET` | `/auth/me` | Có | Any | - | Lấy thông tin user hiện tại |
| `PATCH` | `/auth/me` | Có | Any | `UpdateProfileDto` | Cập nhật profile (name, phone, image) |
| `PATCH` | `/auth/select-role` | Có | Any | `SelectRoleDto` | Chọn role lần đầu cho OAuth user chưa có role |

#### ScalarAuthController

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `POST` | `/scalar-auth/login` | `@Public()` | - | `LoginDto` | Proxy đăng nhập cho Scalar docs |
| `POST` | `/scalar-auth/register` | `@Public()` | - | `RegisterEmailDto` | Proxy đăng ký cho Scalar docs, dùng cùng flow app |
| `POST` | `/scalar-auth/logout` | `@Public()` | - | - | Proxy đăng xuất cho Scalar docs |

#### better-auth Built-in Endpoints (via `/api/auth/*`)

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| `POST` | `/api/auth/sign-in/email` | `@Public()` | Đăng nhập email/password |
| `POST` | `/api/auth/sign-up/email` | `@Public()` | Đăng ký email/password (mặc định Better Auth; app chính dùng `/auth/register-email`) |
| `POST` | `/api/auth/email-otp/send-verification-otp` | `@Public()` | Gửi OTP xác thực email |
| `POST` | `/api/auth/email-otp/check-verification-otp` | `@Public()` | Kiểm tra OTP xác thực email |
| `POST` | `/api/auth/sign-out` | Có | Đăng xuất |
| `POST` | `/api/auth/sign-in/social` | `@Public()` | Đăng nhập Google OAuth |
| `POST` | `/api/auth/email-otp/verify-email` | `@Public()` | Xác thực OTP |
| `POST` | `/api/auth/email-otp/request-password-reset` | `@Public()` | Yêu cầu đặt lại mật khẩu |
| `POST` | `/api/auth/email-otp/reset-password` | `@Public()` | Đặt lại mật khẩu |
| `GET` | `/api/auth/jwks` | `@Public()` | Lấy JWKS public keys |

**DTOs:**

```
UpdateProfileDto:
  name?     : string
  phone?    : string
  image?    : string

SelectRoleDto:
  role      : enum(CANDIDATE, EMPLOYER)

LoginDto:
  email     : string (email format)
  password  : string (min 8)
  rememberMe? : boolean

RegisterEmailDto:
  name      : string
  email     : string (email format)
  password  : string (min 8)
  role      : enum(CANDIDATE, EMPLOYER)
  phone?    : string
```

---

### 4.2 Users Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/users` | Có | ADMIN | `UserQueryDto` | Danh sách users (phân trang) |
| `GET` | `/users/:id` | Có | ADMIN | - | Chi tiết user theo ID |
| `PATCH` | `/users/:id` | Có | Self/ADMIN | `UpdateUserDto` | Cập nhật user |
| `PATCH` | `/users/:id/toggle-active` | Có | ADMIN | - | Bật/tắt isActive |
| `PATCH` | `/users/:id/toggle-lock` | Có | ADMIN | - | Bật/tắt isLocked |
| `DELETE` | `/users/:id` | Có | ADMIN | - | Xóa user |

**DTOs:**

```
UserQueryDto:
  page?    : number (default 1)
  limit?   : number (default 10)
  role?    : enum(Role)
  search?  : string

UpdateUserDto:
  name?    : string
  phone?   : string
  image?   : string
```

---

### 4.3 Companies Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/companies` | `@Public()` | - | `CompanyQueryDto` | Danh sách công ty (phân trang) |
| `GET` | `/companies/slug/:slug` | `@Public()` | - | - | Công ty theo slug (kèm jobs active) |
| `GET` | `/companies/my` | Có | EMPLOYER | - | Công ty của employer hiện tại |
| `GET` | `/companies/:id` | `@Public()` | - | - | Công ty theo ID (kèm 5 jobs active) |
| `POST` | `/companies` | Có | EMPLOYER | `CreateCompanyDto` | Tạo công ty (auto approved) |
| `PATCH` | `/companies/:id` | Có | Owner | `UpdateCompanyDto` | Cập nhật công ty (chỉ owner) |
| `DELETE` | `/companies/:id` | Có | ADMIN | - | Xóa công ty |

**DTOs:**

```
CreateCompanyDto:
  name           : string (required)
  description?   : string
  website?       : string
  logo?          : string
  wardId?        : string
  addressDetail? : string
  size?          : enum(CompanySize)
  industry?      : string

UpdateCompanyDto: (tất cả optional)
  name?, description?, website?, logo?, wardId?, addressDetail?, size?, industry?

CompanyQueryDto:
  page?   : number (default 1)
  limit?  : number (default 10)
  search? : string
```

---

### 4.4 Categories Module

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `GET` | `/categories` | `@Public()` | - | - | Tất cả danh mục |
| `GET` | `/categories/:id` | `@Public()` | - | - | Danh mục theo ID |
| `POST` | `/categories` | Có | ADMIN | `CreateCategoryDto` | Tạo danh mục |
| `PATCH` | `/categories/:id` | Có | ADMIN | `UpdateCategoryDto` | Cập nhật danh mục |
| `DELETE` | `/categories/:id` | Có | ADMIN | - | Xóa danh mục (kiểm tra có job liên kết) |

**DTOs:**

```
CreateCategoryDto:
  name : string (required)
  icon? : string

UpdateCategoryDto:
  name? : string
  icon? : string
```

---

### 4.5 Address Module

| Method | Path | Auth | Roles | Mô tả |
|--------|------|------|-------|--------|
| `GET` | `/address/provinces` | `@Public()` | - | Tất cả tỉnh/thành |
| `GET` | `/address/provinces/:id/districts` | `@Public()` | - | Quận/huyện theo tỉnh |
| `GET` | `/address/districts/:id/wards` | `@Public()` | - | Phường/xã theo quận |
| `GET` | `/address/wards` | `@Public()` | - | Tất cả phường/xã (kèm district+province) |
| `GET` | `/address/wards/:id` | `@Public()` | - | Địa chỉ đầy đủ (ward → district → province) |

---

### 4.6 Jobs Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/jobs` | `@Public()` | - | `JobQueryDto` | Tìm kiếm việc làm (default: ACTIVE only) |
| `GET` | `/jobs/my` | Có | EMPLOYER | (page, limit, status) | Việc làm của employer (tất cả status) |
| `GET` | `/jobs/slug/:slug` | `@Public()` | - | - | Việc làm theo slug |
| `GET` | `/jobs/:id` | `@Public()` | - | - | Việc làm theo ID (kèm tóm tắt applications) |
| `POST` | `/jobs` | Có | EMPLOYER | `CreateJobDto` | Tạo việc làm (status: DRAFT) |
| `PATCH` | `/jobs/:id` | Có | Owner | `UpdateJobDto` | Cập nhật việc làm (chỉ owner công ty) |
| `DELETE` | `/jobs/:id` | Có | ADMIN | - | Xóa việc làm |

**DTOs:**

```
CreateJobDto:
  title          : string (required)
  description    : string (required)
  requirements?  : string
  benefits?      : string
  quantity?      : number (min 1, default 1)
  salaryMin?     : number (min 0)
  salaryMax?     : number (min 0)
  wardId?        : string
  addressDetail? : string
  type?          : enum(JobType, default FULL_TIME)
  experience?    : enum(ExperienceLevel)
  level?         : enum(JobLevel)
  deadline?      : string (ISO date)
  categoryId     : string (required)

UpdateJobDto: (tất cả optional, same fields as CreateJobDto)

JobQueryDto:
  page?       : number (default 1)
  limit?      : number (default 10)
  search?     : string
  categoryId? : string
  type?       : enum(JobType)
  experience? : enum(ExperienceLevel)
  level?      : enum(JobLevel)
  status?     : enum(JobStatus)
  salaryMin?  : number
  salaryMax?  : number
  wardId?     : string
  companyId?  : string
```

---

### 4.7 Applications Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `POST` | `/applications` | Có | CANDIDATE | `CreateApplicationDto` | Nộp đơn ứng tuyển (1 lần/job) |
| `GET` | `/applications/my` | Có | CANDIDATE | (page, limit) | Đơn ứng tuyển của tôi |
| `GET` | `/applications/employer` | Có | EMPLOYER | (page, limit) | Tất cả đơn cho jobs của employer |
| `GET` | `/applications/job/:jobId` | Có | EMPLOYER | (page, limit) | Đơn theo job (kiểm tra ownership) |
| `PATCH` | `/applications/:id/status` | Có | EMPLOYER | `UpdateApplicationStatusDto` | Cập nhật trạng thái đơn |
| `PATCH` | `/applications/:id/bookmark` | Có | EMPLOYER | - | Đánh dấu/ bỏ đánh dấu |
| `DELETE` | `/applications/:id` | Có | CANDIDATE | - | Rút đơn ứng tuyển |

**DTOs:**

```
CreateApplicationDto:
  jobId       : string (required)
  cvUrl?      : string
  resumeId?   : string
  coverLetter? : string

UpdateApplicationStatusDto:
  status : enum(PENDING, REVIEWING, ACCEPTED, REJECTED)
```

---

### 4.8 Resumes Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/resumes/templates` | `@Public()` | - | `?public=true` | Danh sách template (public + của user) |
| `GET` | `/resumes/templates/:id` | `@Public()` | - | - | Template theo ID |
| `POST` | `/resumes/templates` | Có | CANDIDATE | `CreateTemplateDto` | Tạo template (validate HTML/CSS) |
| `PATCH` | `/resumes/templates/:id` | Có | CANDIDATE | `UpdateTemplateDto` | Cập nhật template (owner only) |
| `DELETE` | `/resumes/templates/:id` | Có | CANDIDATE | - | Xóa template (nếu không dùng) |
| `GET` | `/resumes/my` | Có | CANDIDATE | - | Danh sách CV của tôi |
| `GET` | `/resumes/:id` | Có | Any | - | CV theo ID (kiểm tra owner) |
| `GET` | `/resumes/:id/render` | Có | Any | `?mode=view\|edit` | Render CV ra HTML |
| `POST` | `/resumes/render-template` | `@Public()` | - | `{ templateId, data, mode }` | Render template với dữ liệu mẫu |
| `GET` | `/resumes/:id/pdf` | Có | Any | - | Export CV thành PDF (Puppeteer) |
| `POST` | `/resumes` | Có | CANDIDATE | `CreateResumeDto` | Tạo CV |
| `PATCH` | `/resumes/:id` | Có | Owner | `UpdateResumeDto` | Cập nhật CV |
| `DELETE` | `/resumes/:id` | Có | Owner | - | Xóa CV |

**DTOs:**

```
CreateResumeDto:
  title?        : string (default "Hồ sơ của tôi")
  address?      : string
  summary?      : string
  socialLinks?  : array
  education?    : array
  experience?   : array
  projects?     : array
  skills?       : string (comma-separated)
  degree?       : string
  languages?    : string
  isDefault?    : boolean
  templateId    : string (required)

UpdateResumeDto: (tất cả optional)

CreateTemplateDto:
  name         : string (required)
  description? : string
  htmlTemplate : string (required)
  cssTemplate  : string (required)
  isPublic?    : boolean

UpdateTemplateDto: (tất cả optional)
```

**AI CV persist contract:**

- `templateId` chỉ do DB sinh khi gọi `POST /resumes/templates`.
- Agent/FE chỉ gửi template draft: `name`, `htmlTemplate`, `cssTemplate`, `isPublic`.
- Nếu template validator fail, backend trả `400` và không tạo `ResumeTemplate`.
- Sau khi backend trả template `id`, agent dùng id đó làm `templateId` khi gọi `POST /resumes`.
- PDF export chỉ chạy sau khi đã có `resumeId` thật.

---

### 4.9 Notifications Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/notifications` | Có | Any | `NotificationQueryDto` | Thông báo của tôi |
| `GET` | `/notifications/unread-count` | Có | Any | - | Số thông báo chưa đọc `{ count }` |
| `PATCH` | `/notifications/:id/read` | Có | Any | - | Đánh dấu đã đọc |
| `PATCH` | `/notifications/read-all` | Có | Any | - | Đánh dấu tất cả đã đọc |

**DTOs:**

```
NotificationQueryDto:
  page?   : number (default 1)
  limit?  : number (default 10)
  isRead? : boolean
```

---

### 4.10 Blogs Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/blogs` | `@Public()` | - | `BlogQueryDto` | Danh sách blog (đã publish) |
| `GET` | `/blogs/slug/:slug` | `@Public()` | - | - | Blog theo slug (tăng views) |
| `POST` | `/blogs` | Có | ADMIN | `CreateBlogDto` | Tạo blog |
| `PATCH` | `/blogs/:id` | Có | ADMIN | `UpdateBlogDto` | Cập nhật blog |
| `DELETE` | `/blogs/:id` | Có | ADMIN | - | Xóa blog |

**DTOs:**

```
CreateBlogDto:
  title           : string (required)
  type?           : enum(BlogType, default NORMAL)
  content?        : string (required nếu type=NORMAL)
  landingContent? : JSON { html, css, js } (required nếu type=LANDING_PAGE)
  excerpt?        : string
  thumbnail?      : string
  categoryId?     : string
  isPublished?    : boolean

UpdateBlogDto: (tất cả optional)

BlogQueryDto:
  page?       : number (default 1)
  limit?      : number (default 10)
  search?     : string
  categoryId? : string
```

---

### 4.11 Blog Categories Module

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `GET` | `/blog-categories` | `@Public()` | - | - | Tất cả danh mục blog |
| `POST` | `/blog-categories` | Có | ADMIN | `CreateBlogCategoryDto` | Tạo danh mục blog |
| `PATCH` | `/blog-categories/:id` | Có | ADMIN | `UpdateBlogCategoryDto` | Cập nhật danh mục blog |
| `DELETE` | `/blog-categories/:id` | Có | ADMIN | - | Xóa danh mục blog |

**DTOs:**

```
CreateBlogCategoryDto:
  name : string (required)

UpdateBlogCategoryDto:
  name? : string
```

---

### 4.12 Saved Module

| Method | Path | Auth | Roles | Mô tả |
|--------|------|------|-------|--------|
| `POST` | `/saved/jobs/:jobId` | Có | CANDIDATE | Toggle lưu/bỏ lưu việc làm `{ saved: boolean }` |
| `GET` | `/saved/jobs` | Có | CANDIDATE | Danh sách việc làm đã lưu (phân trang) |
| `POST` | `/saved/companies/:companyId` | Có | CANDIDATE | Toggle lưu/bỏ lưu công ty |
| `GET` | `/saved/companies` | Có | CANDIDATE | Danh sách công ty đã lưu (phân trang) |

---

### 4.13 Pricing Module

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `GET` | `/pricing` | `@Public()` | - | `?active=true` | Danh sách gói đăng tin |
| `GET` | `/pricing/:id` | `@Public()` | - | - | Gói theo ID |
| `POST` | `/pricing` | Có | ADMIN | `CreatePricingDto` | Tạo gói |
| `PATCH` | `/pricing/:id` | Có | ADMIN | `UpdatePricingDto` | Cập nhật gói |
| `DELETE` | `/pricing/:id` | Có | ADMIN | - | Xóa gói (kiểm tra có payment) |

**DTOs:**

```
CreatePricingDto:
  name     : string (required)
  days     : number (int, min 1)
  price    : number (int, min 0)
  isActive? : boolean

UpdatePricingDto: (tất cả optional)
```

---

### 4.14 Payments Module

| Method | Path | Auth | Roles | Body | Mô tả |
|--------|------|------|-------|------|--------|
| `POST` | `/payments/checkout` | Có | EMPLOYER | `CreateCheckoutDto` | Tạo phiên thanh toán (Stripe/mock) |
| `POST` | `/payments/webhook` | `@Public()` | - | Raw body | Stripe webhook handler |
| `POST` | `/payments/mock-complete` | Có | EMPLOYER | `{ jobId?, sessionId? }` | Mock thanh toán (dev only) |
| `GET` | `/payments/my` | Có | EMPLOYER | (page, limit) | Lịch sử thanh toán |
| `GET` | `/payments/:id` | Có | EMPLOYER/ADMIN | - | Chi tiết thanh toán |

**DTOs:**

```
CreateCheckoutDto:
  jobId     : string (required)
  packageId : string (required)
```

---

### 4.15 Audit Module

| Method | Path | Auth | Roles | Body/Query | Mô tả |
|--------|------|------|-------|------------|--------|
| `GET` | `/audit` | Có | ADMIN | `QueryAuditDto` | Nhật ký hệ thống (phân trang) |
| `GET` | `/audit/:id` | Có | ADMIN | - | Chi tiết audit log |

**DTOs:**

```
QueryAuditDto:
  action?     : string
  entityType? : string
  entityId?   : string
  actorId?    : string
  from?       : string (ISO date)
  to?         : string (ISO date)
  page?       : number
  limit?      : number
```

---

### 4.16 Inngest Endpoint

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| `GET` | `/api/inngest` | `@Public()` | Health check `{ status: "ok" }` |
| `POST` | `/api/inngest` | `@Public()` | Inngest serve handler (xử lý events) |

---

### 4.17 Tổng kết Endpoints

| Module | Endpoints | Public | Protected |
|--------|-----------|--------|-----------|
| Auth | 3 custom + 9 better-auth | 11 | 2 |
| Users | 6 | 0 | 6 |
| Companies | 7 | 3 | 4 |
| Categories | 5 | 2 | 3 |
| Address | 5 | 5 | 0 |
| Jobs | 7 | 3 | 4 |
| Applications | 7 | 0 | 7 |
| Resumes | 13 | 2 | 11 |
| Notifications | 4 | 0 | 4 |
| Blogs | 5 | 2 | 3 |
| Blog Categories | 4 | 1 | 3 |
| Saved | 4 | 0 | 4 |
| Pricing | 5 | 2 | 3 |
| Payments | 5 | 1 | 4 |
| Audit | 2 | 0 | 2 |
| Inngest | 2 | 2 | 0 |
| **Tổng** | **84** | **24** | **60** |

---

## 5. Frontend Routes & Components

### 5.1 Page Routes

#### Trang công khai (SSR + SEO)

| Route | File | Mô tả |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Trang chủ. Fetch categories, jobs, blogs. JSON-LD Organization + WebSite |
| `/about` | `src/app/about/page.tsx` | Giới thiệu. Stats: 1,200+ jobs, 300+ companies, 5,000+ candidates |
| `/contact` | `src/app/contact/page.tsx` | Liên hệ. Địa chỉ, email, hotline. JSON-LD LocalBusiness |
| `/not-found` | `src/app/not-found.tsx` | Trang 404 tùy chỉnh |

#### Việc làm

| Route | File | Mô tả |
|-------|------|--------|
| `/jobs` | `src/app/jobs/page.tsx` | Danh sách việc làm. Filter, search, pagination. JSON-LD ItemList |
| `/jobs/[slug]` | `src/app/jobs/[slug]/page.tsx` | Chi tiết việc làm. Related jobs. JSON-LD JobPosting + Breadcrumb |

#### Công ty

| Route | File | Mô tả |
|-------|------|--------|
| `/companies` | `src/app/companies/page.tsx` | Danh sách công ty. JSON-LD ItemList |
| `/companies/[slug]` | `src/app/companies/[slug]/page.tsx` | Chi tiết công ty. Jobs của công ty. JSON-LD Organization |

#### Blog

| Route | File | Mô tả |
|-------|------|--------|
| `/blog` | `src/app/blog/page.tsx` | Danh sách blog. Category tabs, sort, pagination. JSON-LD Blog |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Chi tiết blog. TOC, reading progress. Nếu type=LANDING_PAGE → iframe. JSON-LD Article |

#### Thanh toán

| Route | File | Mô tả |
|-------|------|--------|
| `/payment/success` | `src/app/payment/success/page.tsx` | Callback thanh toán. Gọi mock-complete. Hiển thị success/error |

#### Template CV

| Route | File | Mô tả |
|-------|------|--------|
| `/template/[slug]` | `src/app/template/[slug]/page.tsx` | Preview template CV. Hỗ trợ `?resumeId=` |

#### Xác thực (CSR)

| Route | File | Mô tả |
|-------|------|--------|
| `/auth/login` | `src/app/auth/login/page.tsx` | Đăng nhập. Email/password + Google OAuth. Redirect theo role |
| `/auth/register` | `src/app/auth/register/page.tsx` | Đăng ký nhiều bước. Chọn role → thông tin → mật khẩu |
| `/auth/verify-otp` | `src/app/auth/verify-otp/page.tsx` | Xác thực OTP 6 số. 60s timer resend |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Quên mật khẩu. Gửi OTP reset |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | Đặt lại mật khẩu. OTP + password mới |
| `/auth/select-role` | `src/app/auth/select-role/page.tsx` | Chọn role cho OAuth users mới |
| `/auth/callback` | `src/app/auth/callback/page.tsx` | Google OAuth callback handler |

#### Candidate Dashboard (CSR + Sidebar)

| Route | File | Mô tả |
|-------|------|--------|
| `/candidate/dashboard` | `src/app/candidate/dashboard/page.tsx` | Dashboard tổng quan. Stats, profile completion, recent applications |
| `/candidate/profile` | `src/app/candidate/profile/page.tsx` | Chỉnh sửa profile (name, phone) |
| `/candidate/applications` | `src/app/candidate/applications/page.tsx` | Đơn ứng tuyển. Status badge |
| `/candidate/resumes` | `src/app/candidate/resumes/page.tsx` | Danh sách CV. Skills badges, default marker |
| `/candidate/resumes/new` | `src/app/candidate/resumes/new/page.tsx` | CV Builder. Interactive editor với template preview |
| `/candidate/resumes/[id]` | `src/app/candidate/resumes/[id]/page.tsx` | Chi tiết CV. Preview, export PDF, edit, delete |
| `/candidate/resumes/[id]/edit` | `src/app/candidate/resumes/[id]/edit/page.tsx` | Form editor CV |
| `/candidate/resumes/[id]/print` | `src/app/candidate/resumes/[id]/print/page.tsx` | Print-optimized CV. Auto `window.print()` |
| `/candidate/resumes/templates` | `src/app/candidate/resumes/templates/page.tsx` | Gallery template CV |
| `/candidate/ai-cv` | `src/app/candidate/ai-cv/page.tsx` | AI CV Assistant. Full-page CopilotChat |
| `/candidate/notifications` | `src/app/candidate/notifications/page.tsx` | Thông báo |
| `/candidate/saved` | `src/app/candidate/saved/page.tsx` | Việc làm đã lưu |
| `/candidate/settings` | `src/app/candidate/settings/page.tsx` | Cài đặt (theme toggle) |

#### Employer Dashboard (CSR + Sidebar + Chat)

| Route | File | Mô tả |
|-------|------|--------|
| `/employer/dashboard` | `src/app/employer/dashboard/page.tsx` | Dashboard tổng quan. Stats, jobs table, recent applicants |
| `/employer/jobs` | `src/app/employer/jobs/page.tsx` | Quản lý việc làm. Status badge, applications count |
| `/employer/jobs/create` | `src/app/employer/jobs/create/page.tsx` | Tạo việc làm mới. Form đầy đủ fields |
| `/employer/jobs/[id]/checkout` | `src/app/employer/jobs/[id]/checkout/page.tsx` | Chọn gói + thanh toán |
| `/employer/applications` | `src/app/employer/applications/page.tsx` | Quản lý đơn ứng tuyển. Accept/reject |
| `/employer/company` | `src/app/employer/company/page.tsx` | Hồ sơ công ty |
| `/employer/notifications` | `src/app/employer/notifications/page.tsx` | Thông báo |
| `/employer/settings` | `src/app/employer/settings/page.tsx` | Cài đặt (theme toggle) |

### 5.2 BFF Proxy Routes

```
┌──────────────────────────────────────────────────────────────────┐
│                     NEXT.JS BFF PROXY                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser (with cookies)                                          │
│      │                                                           │
│      ├── /api/auth/[...slug]    → BACKEND:3000/api/auth/*        │
│      │   - better-auth endpoints (sign-in, sign-up, OTP, etc.)   │
│      │   - Forward Set-Cookie headers                            │
│      │                                                           │
│      ├── /api/v1/[...slug]      → BACKEND:3000/api/v1/*          │
│      │   - Business API (jobs, companies, applications, etc.)    │
│      │   - Forward Set-Cookie headers                            │
│      │                                                           │
│      ├── /api/agent/[...slug]   → BACKEND:3000/api/v1/*          │
│      │   - Agent tool calls (with auth verification)             │
│      │   - Step 1: Check cookie exists → 401 if missing          │
│      │   - Step 2: Verify cookie via /api/v1/auth/me             │
│      │   - Step 3: Forward to backend                            │
│      │                                                           │
│      └── /api/copilotkit/[[...]] → Python Agent:8125             │
│          - CopilotKit runtime → LangGraph agents                 │
│          - Injects cookie into forwardedProps                    │
│          - 3 agents: default, candidate, recruiter               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Component Inventory

#### Common Components

| Component | File | Mô tả |
|-----------|------|--------|
| `Header` | `components/common/Header.tsx` | Header chính. Nav links, theme toggle, notification bell, user menu |
| `Footer` | `components/common/Footer.tsx` | Footer 4 cột. Brand, links, hotline, email |
| `SearchBar` | `components/common/SearchBar.tsx` | Thanh tìm kiếm việc làm. Keyword + location dropdown |

#### Layout Components

| Component | File | Mô tả |
|-----------|------|--------|
| `Navbar` | `components/layout/navbar.tsx` | Dashboard navbar cho candidate/employer |
| `CandidateSidebar` | `components/layout/candidate-sidebar.tsx` | Sidebar trái candidate. Groups: Overview, Jobs, Profile, System |
| `EmployerSidebar` | `components/layout/employer-sidebar.tsx` | Sidebar trái employer. Groups: Overview, Recruitment, System |

#### Chat Components (CopilotKit)

| Component | File | Mô tả |
|-----------|------|--------|
| `CandidateChatSidebar` | `components/chat/candidate-chat-sidebar.tsx` | AI chat sidebar candidate. CopilotSidebar + agentId="candidate" |
| `EmployerChatSidebar` | `components/chat/employer-chat-sidebar.tsx` | AI chat sidebar employer. CopilotSidebar + agentId="recruiter" |

#### AI/CopilotKit Components

| Component | File | Mô tả |
|-----------|------|--------|
| `useJobSearchRenderer` | `components/ai/renderers/job-search-renderer.tsx` | Render kết quả search_jobs. Job cards clickable |
| `JobListCard` | `components/ai/renderers/job-list-card.tsx` | Card hiển thị danh sách jobs từ AI |
| `useTemplateRenderer` | `hooks/use-template-renderer.tsx` | Render CV preview cho generate/adjust/save tools |
| `useExportPdfTool` | `components/cv/export-pdf-tool.tsx` | Frontend tool export PDF. Gọi API, trigger download |

#### CV Components

| Component | File | Mô tả |
|-----------|------|--------|
| `TemplateRenderer` | `components/cv/template-renderer.tsx` | Render CV HTML trong iframe. Auto-resize, edit mode |

#### Dashboard Components

| Component | File | Mô tả |
|-----------|------|--------|
| `StatsCards` | `components/dashboard/stats-cards.tsx` | 4 stat cards: applications, saved, companies, CVs |
| `RecentApplications` | `components/dashboard/recent-applications.tsx` | Bảng đơn ứng tuyển gần đây |

#### Blog Components

| Component | File | Mô tả |
|-----------|------|--------|
| `BlogPageClient` | `components/blog/BlogPageClient.tsx` | Blog listing. Featured post, category tabs, pagination, sidebar |
| `BlogDetailClient` | `components/blog/BlogDetailClient.tsx` | Blog detail. Reading progress, TOC, engagement buttons |

#### UI Components (shadcn/ui)

`avatar`, `badge`, `button`, `card`, `chart`, `checkbox`, `dialog`, `dropdown-menu`, `empty-state`, `input`, `label`, `popover`, `rich-content`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`

### 5.4 Custom Hooks

| Hook | File | Mô tả |
|------|------|--------|
| `useResumeEditor` | `hooks/use-resume-editor.ts` | State management cho CV editor. CRUD fields, save, load |
| `useTemplateRenderer` | `hooks/use-template-renderer.tsx` | CopilotKit render tools cho CV templates |
| `useScrollAnimation` | `hooks/useScrollAnimation.ts` | IntersectionObserver scroll animation |
| `useTheme` | `hooks/use-theme.tsx` | Theme context. Light/dark/system. localStorage |
| `useAuthToken` | `hooks/use-auth-token.ts` | Fetch auth token |
| `useIsMobile` | `hooks/use-mobile.ts` | Responsive hook (< 768px) |

### 5.5 Lib/Utils

| File | Mô tả |
|------|--------|
| `lib/auth.ts` | Auth utilities: signIn, signUp, signOut, getUserProfile, OTP functions |
| `lib/auth-client.ts` | better-auth client cho Google OAuth |
| `lib/utils.ts` | `cn()` function (clsx + tailwind-merge) |
| `lib/structured-data.ts` | SEO JSON-LD generators: Organization, WebSite, JobPosting, Article, Breadcrumb, LocalBusiness |
| `lib/utils/date.ts` | `timeAgo()` — thời gian tương đối tiếng Việt |
| `lib/utils/format.ts` | `formatSalary()`, job type/experience labels |
| `lib/utils/notifications.ts` | Notification type → emoji icon mapping |

---

## 6. AI Agent Architecture

### 6.1 Agent Graph

```
                        ┌─────────────┐
                        │    START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  auth_node   │   ← Trích xuất cookie/JWT từ config
                        └──────┬──────┘   ← Parse CopilotKit context (user info)
                               │
                        ┌──────▼──────┐
                        │  chat_node   │   ← LLM call với tools bound
                        └──────┬──────┘   ← System prompt tiếng Việt
                               │
                ┌──────────────▼──────────────────────┐
                │      should_continue (conditional)    │
                └──┬──────────┬──────────┬─────────┬───┘
                   │          │          │         │
        ┌──────────▼┐  ┌─────▼──────┐   │    ┌────▼─────┐
        │ tool_node  │  │generate_   │   │    │ __end__  │
        │ (standard) │  │template_   │   │    └──────────┘
        └──────┬─────┘  │node        │   │
               │        └─────┬──────┘   │
               │              │          │
               │        ┌─────▼──────┐   │
               │        │adjust_     │   │
               │        │template_   │   │
               │        │node        │   │
               │        └─────┬──────┘   │
               │              │          │
               │        ┌─────▼──────┐   │
               │        │save_resume │   │
               │        │_node       │   │
               │        └─────┬──────┘   │
               │              │          │
               └──────┬──────┘──────────┘
                      │ (tất cả quay lại chat_node)
               ┌──────▼──────┐
               │  chat_node   │  (loop)
               └─────────────┘
```

### 6.2 Agents

| Agent | Endpoint | Tools | Mô tả |
|-------|----------|-------|--------|
| CandidateAgent | `/candidate` | search_jobs, generate_cv_template, adjust_cv_template, save_resume | Hỗ trợ tìm việc + tạo CV |
| RecruiterAgent | `/recruiter` | get_candidates, rank_candidates, update_application_status, draft_email | Hỗ trợ nhà tuyển dụng |

### 6.3 Tools Chi Tiết

#### Candidate Tools

| Tool | Node Type | Backend Call | Parameters | Mô tả |
|------|-----------|--------------|------------|--------|
| `search_jobs` | ToolNode (standard) | `GET /jobs?search=...&status=ACTIVE&limit=...` | `keyword` (required), `location?`, `min_salary?`, `max_salary?`, `limit?` | Tìm kiếm việc làm |
| `generate_cv_template` | Custom node | None (LLM only) | `description` (required) | Tạo HTML/CSS CV template bằng LLM |
| `adjust_cv_template` | Custom node | None (LLM only) | `adjustment` (required) | Điều chỉnh CV template hiện có |
| `save_resume` | Custom node | `POST /resumes` | `title?` | Lưu CV vào hệ thống |

#### Recruiter Tools

| Tool | Node Type | Backend Call | Parameters | Mô tả |
|------|-----------|--------------|------------|--------|
| `get_candidates` | ToolNode (standard) | `GET /applications/job/{job_id}?limit=...` | `job_id` (required), `status?`, `limit?` | Xem ứng viên đã apply |
| `rank_candidates` | ToolNode (standard) | `GET /jobs/{job_id}` + `GET /applications/job/{job_id}?limit=100` | `job_id` (required), `top_n?` | Xếp hạng ứng viên |
| `update_application_status` | ToolNode (standard) | `PATCH /applications/{id}/status` | `application_id` (required), `status` (required) | Cập nhật trạng thái đơn |
| `draft_email` | ToolNode (standard) | None (template) | `recipient_name`, `email_type`, `job_title`, `company_name`, `additional_info?` | Soan email (interview/rejection/offer/follow_up) |

#### Frontend Tools (chạy trên browser)

| Tool | Hook | Mô tả |
|------|------|--------|
| `export_pdf` | `useExportPdfTool` | Export CV PDF. Gọi `/api/v1/resumes/[id]/pdf`, trigger download |

### 6.4 System Prompts

#### Candidate Agent (tiếng Việt)

```
Bạn là trợ lý AI hỗ trợ ứng viên tìm việc làm và tạo CV tại Phú Quốc.

Thông tin ứng viên hiện tại:
- User ID: {user_id}
- Tên: {user_name}
- Kỹ năng chính: {skills}
- Số năm kinh nghiệm: {experience_years}

Công cụ bạn có thể sử dụng:
1. search_jobs: Tìm kiếm việc làm theo từ khóa, địa điểm, mức lương
2. generate_cv_template: Tạo CV dựa trên thông tin user đã cung cấp
3. adjust_cv_template: Điều chỉnh template CV hiện có
4. export_pdf: Export CV thành PDF (frontend tool)
5. save_resume: Lưu CV đã tạo vào hệ thống

QUY TRÌNH TAO CV (QUAN TRỌNG):
- Bước 1: Thu thập thông tin (kinh nghiệm, học vấn, kỹ năng, dự án, ngoại ngữ, vị trí apply)
- Bước 2: Tổng hợp và gọi generate_cv_template
- Bước 3: Chỉ nói ngắn gọn "CV đã tạo xong! Bạn xem preview dưới nhé."
- Bước 4: Lưu CV nếu user muốn (save_resume)
- Bước 5: Export PDF nếu user muốn (export_pdf)

LƯU Ý:
- Luôn trả lời bằng tiếng Việt
- Không tự bịa dữ liệu
- Khi user muốn sửa CV, dùng adjust_cv_template
- Khi user muốn tìm việc, dùng search_jobs
```

#### Recruiter Agent (tiếng Việt)

```
Bạn là trợ lý AI hỗ trợ nhà tuyển dụng tại Phú Quốc.

Thông tin nhà tuyển dụng hiện tại:
- User ID: {user_id}
- Tên: {user_name}
- Công ty: {company_name}
- Các tin dang tuyển: {active_job_ids}

Công cụ:
- get_candidates: Xem ứng viên đã apply cho job
- rank_candidates: Xếp hạng ứng viên
- update_application_status: Cập nhật trạng thái
- draft_email: Soạn email (interview/rejection/offer/follow_up)

Luôn trả lời bằng ngôn ngữ của người dùng (tiếng Việt hoặc tiếng Anh).
Khi cần thông tin thêm, hỏi ngắn gọn.
```

### 6.5 State Schemas

#### CandidateState (extends CopilotKitState)

```python
class CandidateState(CopilotKitState):
    # Auth
    authorization: Optional[Dict[str, Any]] = None

    # CV Flow control
    cv_flow: str = "idle"       # idle | collecting | generating | preview | editing | done
    step: str = ""
    progress: int = 0           # 0-100

    # User info (thu thập trong conversation)
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_address: Optional[str] = None
    user_summary: Optional[str] = None
    user_skills: List[str] = []
    user_education: List[Dict[str, Any]] = []
    user_experience: List[Dict[str, Any]] = []
    user_projects: List[Dict[str, Any]] = []
    user_languages: List[str] = []

    # Template (generated by agent, synced to FE)
    current_template_html: Optional[str] = None
    current_template_css: Optional[str] = None

    # Resume (sau khi save)
    current_resume_id: Optional[str] = None
```

#### RecruiterState (extends CopilotKitState)

```python
class RecruiterState(CopilotKitState):
    authorization: Optional[Dict[str, Any]] = None
    # Stateless — không có thêm fields
```

### 6.6 CopilotKit Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   COPILOTKIT DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User nhập chat trong CopilotChat/CopilotSidebar            │
│      │                                                      │
│      ▼                                                      │
│  CopilotKitProvider (frontend)                               │
│      │                                                      │
│      ▼                                                      │
│  POST /api/copilotkit (Next.js BFF)                         │
│      │  [inject cookie into forwardedProps]                  │
│      ▼                                                      │
│  Python Agent (FastAPI :8125)                                │
│      │  [CustomLangGraphAGUIAgent.prepare_stream()]          │
│      │  [auth_node: extract cookie, parse context]           │
│      │  [chat_node: LLM with tools]                         │
│      │  [tool_node / custom nodes: execute tools]            │
│      ▼                                                      │
│  Tool calls → /api/agent/* (Next.js BFF)                    │
│      │  [verify cookie via /api/v1/auth/me]                  │
│      ▼                                                      │
│  Backend API (:3000)                                         │
│      │                                                      │
│      ▼                                                      │
│  Agent returns result → CopilotKit renders                   │
│      │                                                      │
│      ▼                                                      │
│  Render tools (useRenderTool):                               │
│    - search_jobs → JobListCard                               │
│    - generate_cv_template → CVPreviewInline (iframe)         │
│    - adjust_cv_template → CVPreviewInline (iframe)           │
│    - save_resume → loading indicator                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.7 FastAPI Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/candidate` | AG-UI SSE stream cho CandidateAgent |
| `POST` | `/recruiter` | AG-UI SSE stream cho RecruiterAgent |
| `GET` | `/health` | Health check `{ status: "ok" }` |

---

## 7. Authentication Flow

### 7.1 better-auth Configuration

| Aspect | Chi tiết |
|--------|----------|
| Database adapter | PrismaAdapter (PostgreSQL) |
| Secret | `BETTER_AUTH_SECRET` (min 32 chars) |
| Email+password | Enabled, requireEmailVerification: true |
| Social providers | Google OAuth |
| Plugins | `jwt` (24h expiration), `emailOTP` (6 digits, 300s expiry, 3 attempts) |
| Account linking | Enabled, trusted: ["google"] |
| Secondary storage | Redis (prefix: `better-auth:`) |
| User additional fields | role?, phone?, isActive, isLocked |

### 7.2 Login Flow

```
User nhập email + password
    │
    ▼
POST /api/auth/sign-in/email  (qua BFF proxy)
    │
    ▼
better-auth tạo session → Set-Cookie: better-auth.session_token
    │
    ▼
BFF proxy forward Set-Cookie → Browser
    │
    ▼
GET /api/v1/auth/me → lấy role
    │
    ├── role = null → /auth/select-role
    ├── role = EMPLOYER → /employer/dashboard
    └── role = CANDIDATE → /candidate/dashboard
```

### 7.3 Registration Flow

```
Bước 1: Chọn role (CANDIDATE / EMPLOYER) + Google OAuth option
    │
    ▼
Bước 2: Nhập thông tin (name, email, phone)
    │
    ▼
Bước 3: Đặt mật khẩu (employer có thêm bước)
    │
    ▼
POST /api/v1/auth/register-email
    │
    ▼
Chuyển đến /auth/verify-otp
    │
    ▼
User nhập 6 số OTP
    │
    ▼
POST /api/v1/auth/complete-email-registration
    │
    ▼
Redirect → /auth/login?verified=true
```

> `verify-otp` có 2 mode:
> - `mode=register`: dùng sau đăng ký email/password, cần password tạm để hoàn tất account.
> - `mode=verify-email`: chỉ xác nhận email, dùng cho login chưa verify hoặc forgot password cần xác nhận email trước khi reset.
> - `next=reset-password` sẽ xác nhận email xong rồi chuyển sang tạo OTP reset password.

### 7.4 Google OAuth Flow

```
authClient.signIn.social({ provider: "google", callbackURL })
    │
    ▼
Google login page
    │
    ▼
Redirect → /auth/callback
    │
    ▼
Fetch user profile → route theo role
    │
    ├── role = null → /auth/select-role
    ├── role = EMPLOYER → /employer/dashboard
    └── role = CANDIDATE → /candidate/dashboard
```

### 7.5 Password Reset Flow

```
/auth/forgot-password
    │  Nhập email
    ▼
POST /api/v1/auth/request-password-reset
    │
    ├── RESET_OTP_SENT ───────▶ /auth/reset-password?email=...
    ├── VERIFY_EMAIL_REQUIRED ─▶ /auth/verify-otp?mode=verify-email&next=reset-password
    └── OAUTH_ONLY ────────────▶ Hiện nhắc đăng nhập bằng Google

/auth/reset-password?email=...
    │  Nhập OTP + password mới
    ▼
POST /api/auth/email-otp/reset-password
    │
    ▼
/auth/login?reset=true
```

### 7.6 Auth Priority (Backend)

```
1. Authorization: Bearer <JWT>    → JWT verify via JWKS + DB check
2. better-auth.session_token      → session verify via getSession()
3. Neither → 401 Unauthorized
```

### 7.7 JWT Verification (Backend)

```
Bearer token
    │
    ▼
Fetch JWKS from /api/auth/jwks
    │
    ▼
jose.jwtVerify(token, JWKS)
    │
    ▼
Check DB: isActive, isLocked
    │
    ▼
Set request.user = { id, email, name, role }
```

---

## 8. Data Flow Diagrams

### 8.1 Job Posting Flow

```
Employer tạo job (POST /jobs)
    │  status = DRAFT
    ▼
Employer chọn gói pricing
    │
    ▼
POST /payments/checkout { jobId, packageId }
    │  Tạo Stripe session / mock session
    ▼
Redirect → Stripe / Mock
    │
    ▼
Payment success → POST /payments/mock-complete hoặc Stripe webhook
    │
    ▼
PaymentsService.completePayment()
    │  1. Update payment status = COMPLETED
    │  2. Calculate deadline = now + package.days
    │  3. JobContractService.activateJob(jobId, deadline) → status = ACTIVE
    │  4. Send Inngest event: job.activated
    ▼
Inngest: schedule-job-expiry
    │  Schedule job.expiring-soon (3 days trước deadline)
    │  Schedule job.expired (khi deadline)
    ▼
Inngest: on-job-expired
    │  Set job status = CLOSED
    │  Create SYSTEM notification cho employer
    ▼
Job CLOSED
```

### 8.2 Application Flow

```
Candidate tìm việc (GET /jobs?search=...)
    │
    ▼
Xem chi tiết (GET /jobs/:id)
    │
    ▼
Nộp đơn (POST /applications { jobId, resumeId?, coverLetter? })
    │  Kiểm tra: job ACTIVE, chưa apply (unique userId+jobId)
    ▼
Send Inngest event: application.created
    │
    ▼
Inngest: on-application-created
    │  Create APPLICATION_RECEIVED notification cho employer
    ▼
Employer xem đơn (GET /applications/employer)
    │
    ▼
Cập nhật trạng thái (PATCH /applications/:id/status { status: "ACCEPTED" })
    │
    ▼
Send Inngest event: application.accepted
    │
    ▼
Inngest: on-application-accepted
    │  Create APPLICATION_ACCEPTED notification cho candidate
    ▼
Candidate nhận thông báo
```

### 8.3 AI CV Generation Flow

```
User mở /candidate/ai-cv
    │
    ▼
CopilotChat kết nối → POST /api/copilotkit → Agent
    │
    ▼
Agent chào hỏi, thu thập thông tin
    │  (hỏi: kỹ năng, kinh nghiệm, học vấn, vị trí apply)
    │
    ▼
LLM gọi tool: generate_cv_template { description }
    │
    ▼
generate_template_node:
    │  1. cv_flow = "generating", progress = 50
    │  2. copilotkit_emit_state() → frontend nhận state
    │  3. LLM tạo HTML + CSS CV
    │  4. cv_reviewer validate/repair HTML + CSS tối đa 2 lần
    │  5. cv_flow = "preview", progress = 80
    │  6. Return ToolMessage với HTML/CSS
    ▼
Frontend render CV preview (useTemplateRenderer → iframe)
    │
    ▼
User muốn sửa: "Đổi header thành xanh đậm"
    │
    ▼
LLM gọi tool: adjust_cv_template { adjustment }
    │
    ▼
adjust_template_node:
    │  1. cv_flow = "editing"
    │  2. LLM chỉnh sửa HTML/CSS
    │  3. cv_reviewer validate/repair HTML + CSS tối đa 2 lần
    │  4. Return HTML/CSS mới
    ▼
User đồng ý: "Lưu CV đi"
    │
    ▼
LLM gọi tool: save_resume { title }
    │
    ▼
save_resume_node:
    │  1. Review/repair template draft lần cuối
    │  2. POST /resumes/templates { name, htmlTemplate, cssTemplate, isPublic }
    │  3. Backend validator pass → DB tạo ResumeTemplate.id
    │  4. POST /resumes { title, summary, skills, templateId, ... }
    │  5. cv_flow = "done"
    │  6. Return resume ID + template ID
    ▼
User muốn PDF: "Export PDF"
    │
    ▼
LLM gọi frontend tool: export_pdf { resumeId }
    │  (graph __end__, frontend xử lý)
    ▼
Frontend: GET /api/v1/resumes/[id]/pdf → download
```

### 8.4 Payment Flow

```
Employer tạo job → status = DRAFT
    │
    ▼
/employer/jobs/[id]/checkout
    │  Fetch pricing packages
    │  Chọn gói → POST /payments/checkout { jobId, packageId }
    ▼
PaymentsService.createCheckout()
    │  1. Verify job.company.ownerId = currentUser
    │  2. Check job.status ≠ ACTIVE
    │  3. Check no pending payment exists
    │  4. Create Stripe session hoặc Mock session
    ▼
┌─── Stripe Flow ───┐    ┌─── Mock Flow ───┐
│ Redirect → Stripe  │    │ Return URL       │
│ Payment page       │    │ mock_session_*   │
│ User pays          │    └──────────────────┘
│ Stripe webhook ────│──┐
└────────────────────┘  │
                        ▼
              POST /payments/webhook
              │  Verify signature
              │  Extract session/job info
              ▼
              PaymentsService.completePayment()
              │  1. status = COMPLETED
              │  2. deadline = now + days
              │  3. job.status = ACTIVE
              │  4. Send job.activated event
              ▼
              Job ACTIVE → hiển thị trên trang tìm kiếm
```

---

## 9. Event System (Inngest)

### 9.1 Event Types

| Event Name | Data | Mô tả |
|------------|------|--------|
| `application.created` | `{ applicationId, jobTitle, companyName, employerId?, candidateId? }` | Đơn ứng tuyển mới |
| `application.accepted` | `{ applicationId, jobTitle, companyName, employerId?, candidateId? }` | Đơn được chấp nhận |
| `application.rejected` | `{ applicationId, jobTitle, companyName, employerId?, candidateId? }` | Đơn bị từ chối |
| `user.registered` | `{ userId, email, name }` | User đăng ký mới |
| `job.activated` | `{ jobId, deadline? }` | Job được kích hoạt (sau thanh toán) |
| `job.expiring-soon` | `{ jobId, deadline? }` | Job sắp hết hạn (3 ngày trước) |
| `job.expired` | `{ jobId, deadline? }` | Job hết hạn |

### 9.2 Functions

#### Notification Functions

| Function | Trigger | Hành động |
|----------|---------|-----------|
| `on-application-created` | `application.created` | Tạo notification APPLICATION_RECEIVED cho employer |
| `on-application-accepted` | `application.accepted` | Tạo notification APPLICATION_ACCEPTED cho candidate |
| `on-application-rejected` | `application.rejected` | Tạo notification APPLICATION_REJECTED cho candidate |
| `on-job-activated` | `job.activated` | Tạo notification JOB_APPROVED cho company owner |

#### Job Expiry Functions

| Function | Trigger | Hành động |
|----------|---------|-----------|
| `schedule-job-expiry` | `job.activated` | Schedule `job.expiring-soon` (3 ngày trước deadline) và `job.expired` (khi deadline) |
| `on-job-expiring-soon` | `job.expiring-soon` | Tạo notification JOB_DEADLINE cho users đã lưu job |
| `on-job-expired` | `job.expired` | Set job.status = CLOSED, tạo SYSTEM notification cho employer |

#### User Functions

| Function | Trigger | Hành động |
|----------|---------|-----------|
| `on-user-registered` | `user.registered` | Log welcome, tạo SYSTEM welcome notification |

#### Scheduled Functions

| Function | Trigger | Hành động |
|----------|---------|-----------|
| `weekly-employer-summary` | Cron: `0 9 * * 4,6` (T4 & T6 9AM) | Tổng hợp số đơn/tin tuyển dụng cho mỗi employer, tạo SYSTEM notification |

---

## 10. Caching Strategy

### 10.1 Cache Configuration

| Module | Prefix | TTL | Key Pattern | Invalidation |
|--------|--------|-----|-------------|--------------|
| Companies | `companies` | 300s (5min) | `companies:list:{page}:{limit}:{search}`, `companies:{id}`, `companies:slug:{slug}` | `delPattern('companies:*')` sau write |
| Categories | `categories` | 3600s (1hr) | `categories:all`, `categories:{id}` | `delPattern('categories:*')` sau write |
| Address | `address` | 86400s (24hr) | `address:provinces`, `address:districts:{provinceId}`, `address:wards:{districtId}`, `address:full:{wardId}` | Không invalidation (data tĩnh) |
| Jobs | `jobs` | 300s (5min) | `jobs:list:{page}:{limit}:{search}:{categoryId}:...`, `jobs:{id}`, `jobs:slug:{slug}` | `delPattern('jobs:*')` sau write |
| Blogs | `blogs` | 300s (5min) | `blogs:list:{page}:{limit}:{search}:{categoryId}`, `blogs:slug:{slug}` | `delPattern('blogs:*')` sau write |
| Blog Categories | `blog_categories` | 3600s (1hr) | `blog_categories:all` | `delPattern('blog_categories:*')` sau write |
| Pricing | `pricing` | 3600s (1hr) | `pricing:all:{active}`, `pricing:{id}` | `delPattern('pricing:*')` sau write |

### 10.2 Modules KHÔNG dùng cache

Notifications, Applications, Resumes, Saved, Users, Payments, Audit

### 10.3 CacheService Methods

| Method | Signature | Mô tả |
|--------|-----------|--------|
| `get<T>` | `(key: string) => Promise<T \| null>` | Get cached value (JSON parsed) |
| `set` | `(key: string, value: unknown, ttl?: number) => Promise<void>` | Set with TTL (default 300s) |
| `del` | `(key: string) => Promise<void>` | Delete single key |
| `delPattern` | `(pattern: string) => Promise<void>` | Delete by glob pattern (SCAN + batch DEL) |
| `has` | `(key: string) => Promise<boolean>` | Check existence |
| `generateKey` | `(prefix: string, ...params) => string` | Tạo key `prefix:param1:param2:...` |

---

## 11. Infrastructure & Deployment

### 11.1 Services & Ports

| Service | Technology | Port |
|---------|------------|------|
| NestJS Backend | NestJS 11 + TypeScript | 3000 |
| Next.js Frontend | Next.js 16 + React 19 | 3001 |
| Python AI Agent | FastAPI + LangGraph | 8125 |
| PostgreSQL 16 | Docker container `pq-postgres` | 5435 |
| Redis 7 | Docker container `pq-redis` | 6381 |
| Inngest Dev | inngest-cli | (default) |

### 11.2 Docker Infrastructure

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16
    container_name: pq-postgres
    ports: "5435:5432"
    environment:
      POSTGRES_USER: pq_user
      POSTGRES_PASSWORD: pq_pass123
      POSTGRES_DB: pq_jobs
    volumes: pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: pq-redis
    ports: "6381:6379"
    volumes: redisdata:/data
```

### 11.3 Production Dockerfile (Multi-stage)

```
Stage 1 (frontend builder): node:20-slim
  → npm install → Next.js build (standalone)

Stage 2 (runner): python:3.12-slim
  → Install Node.js 20 + uv
  → Install Python deps
  → Copy serve.py (agent adapter)
  → Copy Next.js standalone
  → Expose port 3000
  → entrypoint.sh
```

### 11.4 PM2 Configuration

| Process | Script | CWD |
|---------|--------|-----|
| backend | `dist/src/main.js` | `backend/` |
| frontend | `next dev -p 3001` | `web/` |
| inngest | `npx inngest-cli dev -u http://localhost:3000/api/inngest` | root |
| agent | `scripts/run-agent.sh` | `web/` |

### 11.5 Environment Variables

#### Backend (backend/.env)

| Variable | Required | Mô tả |
|----------|----------|--------|
| `DATABASE_URL` | YES | PostgreSQL connection string |
| `REDIS_URL` | YES | Redis connection string |
| `BETTER_AUTH_SECRET` | YES | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | YES | Auth base URL (http://localhost:3000) |
| `FRONTEND_URL` | YES | CORS origin (http://localhost:3001) |
| `AGENT_URL` | YES | AI agent URL (http://localhost:8125) |
| `INNGEST_DEV` | YES (dev) | Inngest dev mode flag |
| `REQUIRE_EMAIL_VERIFICATION` | NO | Toggle email verification |
| `RESEND_API_KEY` | Optional | Email service key |
| `EMAIL_FROM` | Optional | Sender email |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth |
| `STRIPE_SECRET_KEY` | Optional | Stripe payments |
| `STRIPE_PUBLISHABLE_KEY` | Optional | Stripe frontend |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook |

#### Frontend (web/.env)

| Variable | Required | Mô tả |
|----------|----------|--------|
| `BACKEND_URL` | YES | Backend URL cho SSR (http://localhost:3000) |
| `AGENT_URL` | YES | Agent URL (http://localhost:8125) |
| `OPENAI_API_KEY` | YES | LLM API key |

#### Agent (web/agent/core/config.py)

Đọc từ `web/.env`:
- `BACKEND_URL` (default: http://localhost:3000/api/v1)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: gpt-4o-mini)
- `AGENT_PORT` (default: 8125)

### 11.6 Database Migrations

| Migration | Ngày | Mô tả |
|-----------|------|--------|
| `20260527172752_init` | 27/05/2026 | Schema ban đầu (auth + core tables) |
| `20260528134559_add_pricing_payments_audit` | 28/05/2026 | Thêm pricing, payments, audit |
| `20260530_remove_rejected_and_isapproved` | 30/05/2026 | Dọn dẹp schema |
| `20260531175700_rename_entities` | 31/05/2026 | Đổi tên entities |
| `20260606120319_sync_schema` | 06/06/2026 | Đồng bộ schema (mới nhất) |

### 11.7 Seed Data

| Data | Chi tiết |
|------|----------|
| Address | Kiên Giang → Phú Quốc → 4 phường (Dương Đông, An Thới, Cửa Cạn, Hàm Ninh) |
| Categories | 8 ngành nghề (Nhà hàng-Khách sạn, Du lịch, CNTT, Bán hàng, Kế toán, Xây dựng, Y tế, Giáo dục) |
| Templates | 5 CV templates (Modern, Classic, Creative, Minimalist, Tech) |
| Users | 3 users: admin, employer, candidate (password: password123) |
| Company | Phú Quốc Resort & Spa |
| Jobs | 3 jobs: Lễ tân khách sạn, Frontend Developer, Hướng dẫn viên du lịch |
| Blog | 1 category (Tin tức) + 1 bài blog |

### 11.8 Deployment Target

**Platform:** Railway (Docker-based, single deploy)
- Mỗi service là 1 Railway service trong cùng 1 project
- PostgreSQL + Redis dùng Railway managed services
- Multi-stage Dockerfile tại `web/Dockerfile`

---

## 12. Security & Known Issues

### 12.1 Critical Issues

| # | Vấn đề | File | Mức độ |
|---|--------|------|--------|
| 1 | **User tự escalate role** — `PATCH /auth/me` chấp nhận field `role`, user có thể tự đổi CANDIDATE → EMPLOYER | `auth.controller.ts:24-35`, `auth.service.ts:33-49` | 🔴 Critical |
| 2 | **JWT bypass isActive/isLocked** — JWT path trong AuthGuard kiểm tra DB nhưng có thể bypass nếu JWKS key bị leak | `auth.guard.ts:87-117` | 🔴 Critical |
| 3 | **Inngest serve handler chưa mount đúng** — Mount cả ở main.ts và controller, có thể gây confusion | `inngest.controller.ts`, `main.ts` | 🔴 Critical |
| 4 | **Payment completion không có transaction** — Không dùng Prisma transaction, có thể inconsistency nếu fail giữa chừng | `payments.service.ts:140-151` | 🔴 Critical |

### 12.2 Medium Issues

| # | Vấn đề | File | Mức độ |
|---|--------|------|--------|
| 5 | **Exception filter leak 500 details** — Non-HttpException gửi `exception.message` cho client (lộ thông tin DB errors) | `global-exception.filter.ts:31-33` | 🟡 Medium |
| 6 | **Rate limiting in-memory** — ThrottlerModule dùng in-memory store, không hoạt động khi scale nhiều instances | `app.module.ts` | 🟡 Medium |
| 7 | **CORS double registration** — CORS config ở cả main.ts và AuthModule | `main.ts`, AuthModule | 🟡 Medium |
| 8 | **Không có helmet middleware** — Không có security headers | `main.ts` | 🟡 Medium |
| 9 | **Không có pagination limit enforcement** — Client có thể gửi limit=10000 | Multiple services | 🟡 Medium |

### 12.3 Agent Security Notes

| Vấn đề | Chi tiết |
|--------|----------|
| JWT decode không verify | Agent dùng `base64.decode()` thay vì verify signature. Tin tưởng frontend data |
| Agent proxy verification | `/api/agent/*` verify cookie qua `/api/v1/auth/me` trước khi forwarding — pattern tốt |
| CORS allow all | Agent cho phép `origin: "*"` — chấp nhận được vì chỉ internal |

---

## 13. Development Commands

### 13.1 Setup

```bash
# Clone và install
git clone <repo>
cd job-phuquoc
pnpm install

# Start database
pnpm db:up              # docker compose up -d (PostgreSQL + Redis)

# Run migrations
cd backend && pnpm prisma migrate dev

# Seed database
cd backend && pnpm prisma db seed

# Start all services (PM2)
pnpm dev
```

### 13.2 Run Individual Services

```bash
# Backend (port 3000)
cd backend && pnpm dev

# Frontend (port 3001)
cd web && pnpm dev

# Python Agent (port 8125)
cd web && bash scripts/run-agent.sh
```

### 13.3 Database

```bash
# Reset database (drop + migrate + seed)
pnpm db:reset

# Open Prisma Studio GUI
pnpm db:studio

# Create new migration
cd backend && pnpm prisma migrate dev --name <migration_name>

# Generate Prisma client
cd backend && pnpm prisma generate
```

### 13.4 PM2

```bash
pnpm dev                # Start all
pnpm dev:stop           # Stop all
pnpm dev:restart        # Restart all
pnpm dev:logs           # View logs
pnpm dev:status         # View status
pnpm dev:flush          # Clear logs
```

### 13.5 Build & Deploy

```bash
# Build all (Turborepo)
pnpm build

# Build backend only
cd backend && pnpm build    # output: dist/src/main.js

# Docker build
docker build -f web/Dockerfile -t phuquoc-web .
```

### 13.6 Testing

```bash
# Backend tests
cd backend && pnpm test
cd backend && pnpm test:e2e

# E2E tests (Docker)
cd web && docker compose -f docker-compose.test.yml up
```

### 13.7 Backup & Restore

```bash
# Backup database to JSON
./scripts/backup-db.sh [output_dir]

# Restore from JSON backup
cd backend && npx ts-node ../scripts/seed-from-backup.ts [backup_dir]
```

### 13.8 Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@phuquoc.jobs | password123 | ADMIN |
| employer@phuquoc.jobs | password123 | EMPLOYER |
| candidate@phuquoc.jobs | password123 | CANDIDATE |

---

## 14. File Inventory

### 14.1 Backend Key Files

```
backend/
├── src/
│   ├── main.ts                           # Entry point, global setup
│   ├── app.module.ts                     # Root module, global config
│   ├── prisma/
│   │   ├── prisma.module.ts              # @Global()
│   │   └── prisma.service.ts             # Prisma client
│   ├── auth/
│   │   ├── auth.ts                       # better-auth config
│   │   ├── auth.module.ts                # Auth module (guards)
│   │   ├── auth.controller.ts            # /auth/me endpoints
│   │   ├── auth.service.ts               # Profile CRUD
│   │   ├── scalar-auth.controller.ts     # Scalar docs auth proxy
│   │   ├── guards/
│   │   │   ├── auth.guard.ts             # JWT + session verification
│   │   │   └── roles.guard.ts            # Role-based access
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts       # @Public()
│   │   │   ├── roles.decorator.ts        # @Roles()
│   │   │   └── current-user.decorator.ts # @CurrentUser()
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       ├── login.dto.ts
│   │       ├── register-email.dto.ts
│   │       ├── complete-email-registration.dto.ts
│   │       └── request-password-reset.dto.ts
│   ├── common/
│   │   ├── cache/
│   │   │   ├── cache.module.ts           # @Global()
│   │   │   └── cache.service.ts          # Redis cache
│   │   ├── email/
│   │   │   └── resend.client.ts          # Resend singleton
│   │   ├── logger/
│   │   │   ├── logger.module.ts          # @Global()
│   │   │   └── pino-logger.service.ts    # Pino logger
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── parse-cuid.pipe.ts
│   │   └── types/
│   │       ├── index.ts
│   │       ├── request.types.ts
│   │       ├── response.types.ts
│   │       └── auth.types.ts
│   ├── inngest/
│   │   ├── client.ts                     # Inngest client
│   │   ├── events.types.ts               # Event type definitions
│   │   ├── inngest.service.ts            # Inngest service
│   │   ├── inngest.controller.ts         # Serve handler
│   │   ├── inngest.module.ts             # @Global()
│   │   └── functions/
│   │       ├── notification.functions.ts  # 4 notification handlers
│   │       ├── job-expiry.function.ts     # 3 job expiry handlers
│   │       ├── user.functions.ts          # 1 user handler
│   │       └── weekly-summary.function.ts # Cron summary
│   └── modules/
│       ├── shared/                       # @Global() contracts
│       │   ├── shared.module.ts
│       │   ├── job.contract.ts
│       │   ├── company.contract.ts
│       │   ├── pricing.contract.ts
│       │   ├── payment.contract.ts
│       │   └── user.contract.ts
│       ├── users/                        # 6 endpoints
│       ├── companies/                    # 7 endpoints
│       ├── categories/                   # 5 endpoints
│       ├── address/                      # 5 endpoints
│       ├── jobs/                         # 7 endpoints
│       ├── applications/                 # 7 endpoints
│       ├── resumes/                      # 13 endpoints
│       ├── notifications/                # 4 endpoints
│       ├── blogs/                        # 5 endpoints
│       ├── blog-categories/              # 4 endpoints
│       ├── saved/                        # 4 endpoints
│       ├── pricing/                      # 5 endpoints
│       ├── payments/                     # 5 endpoints
│       └── audit/                        # 2 endpoints
└── prisma/
    ├── schema.prisma                     # Database schema
    ├── seed.ts                           # Seed data
    └── migrations/                       # 5 migrations
```

### 14.2 Frontend Key Files

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (HTML, fonts, SEO)
│   │   ├── page.tsx                      # Homepage
│   │   ├── providers.tsx                 # Global providers (Theme, CopilotKit)
│   │   ├── not-found.tsx                 # 404 page
│   │   ├── about/page.tsx               # About page
│   │   ├── contact/page.tsx             # Contact page
│   │   ├── jobs/
│   │   │   ├── page.tsx                 # Job listing
│   │   │   └── [slug]/page.tsx          # Job detail
│   │   ├── companies/
│   │   │   ├── page.tsx                 # Company listing
│   │   │   └── [slug]/page.tsx          # Company detail
│   │   ├── blog/
│   │   │   ├── page.tsx                 # Blog listing
│   │   │   └── [slug]/page.tsx          # Blog detail
│   │   ├── payment/success/page.tsx     # Payment callback
│   │   ├── template/[slug]/page.tsx     # CV template preview
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-otp/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   ├── select-role/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── candidate/
│   │   │   ├── layout.tsx               # Sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   ├── resumes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx         # CV Builder
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── [id]/edit/page.tsx
│   │   │   │   ├── [id]/print/page.tsx
│   │   │   │   └── templates/page.tsx
│   │   │   ├── ai-cv/page.tsx           # AI CV Assistant
│   │   │   ├── notifications/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── employer/
│   │   │   ├── layout.tsx               # Sidebar + Chat layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/checkout/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   ├── company/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...slug]/route.ts      # Auth proxy
│   │       ├── v1/[...slug]/route.ts        # API proxy
│   │       ├── agent/[...slug]/route.ts     # Agent proxy (with auth)
│   │       └── copilotkit/[[...slug]]/route.ts # CopilotKit runtime
│   ├── components/
│   │   ├── common/                      # Header, Footer, SearchBar
│   │   ├── layout/                      # Navbar, Sidebars
│   │   ├── chat/                        # CopilotKit chat sidebars
│   │   ├── ai/renderers/               # AI tool renderers
│   │   ├── cv/                          # CV components
│   │   ├── dashboard/                   # Dashboard components
│   │   ├── blog/                        # Blog components
│   │   ├── jobs/                        # Job components
│   │   ├── auth/                        # Auth components
│   │   ├── ui/                          # shadcn/ui components
│   │   └── generative-ui/              # Charts, pickers
│   ├── hooks/
│   │   ├── use-resume-editor.ts         # CV editor state
│   │   ├── use-template-renderer.tsx    # CopilotKit CV render
│   │   ├── useScrollAnimation.ts        # Scroll animation
│   │   ├── use-theme.tsx               # Theme provider
│   │   ├── use-auth-token.ts           # Auth token
│   │   └── use-mobile.ts              # Responsive
│   └── lib/
│       ├── auth.ts                      # Auth utilities
│       ├── auth-client.ts              # better-auth client
│       ├── utils.ts                     # cn() utility
│       ├── structured-data.ts          # SEO JSON-LD
│       └── utils/
│           ├── date.ts                  # timeAgo()
│           ├── format.ts               # formatSalary()
│           └── notifications.ts        # Noti icons
```

### 14.3 Agent Key Files

```
web/agent/
├── main.py                              # FastAPI entry point
├── graphs.py                            # Graph exports
├── langgraph.json                       # LangGraph Platform config
├── pyproject.toml                       # Python dependencies
├── core/
│   ├── config.py                        # Settings (env vars)
│   ├── context.py                       # AgentContext model
│   ├── prompts.py                       # System prompts (Vietnamese)
│   ├── api_client.py                    # httpx async client
│   └── agent_factory.py                # Graph factory functions
├── agents/
│   ├── base_agent.py                    # Abstract base + graph builder
│   ├── custom_agent.py                  # CopilotKit AG-UI override
│   ├── candidate_agent.py              # Candidate graph
│   └── recruiter_agent.py             # Recruiter graph
├── schemas/
│   ├── candidate.py                     # CandidateState
│   └── recruiter.py                     # RecruiterState
└── tools/
    ├── base_tool.py                     # Abstract tool base
    ├── helpers.py                       # Utility functions
    ├── candidate/
    │   ├── search_jobs.py               # Search jobs tool
    │   └── cv_tools.py                 # Generate, adjust, save CV tools
    └── recruiter/
        ├── get_candidates.py            # Get applicants tool
        ├── rank_candidates.py           # Rank applicants tool
        ├── update_application_status.py # Update status tool
        └── draft_email.py              # Draft email tool
```

### 14.4 Infrastructure Files

```
root/
├── ecosystem.config.js                  # PM2 config
├── turbo.json                           # Turborepo config
├── pnpm-workspace.yaml                  # Monorepo config
├── package.json                         # Root package.json
├── docker/
│   ├── docker-compose.yml               # PostgreSQL + Redis
│   └── .env.example                     # Env template
├── scripts/
│   ├── backup-db.sh                     # Database backup
│   └── seed-from-backup.ts             # Restore from backup
├── web/
│   ├── Dockerfile                       # Production multi-stage
│   ├── docker-route-override.ts         # Docker CopilotKit override
│   ├── docker/
│   │   ├── Dockerfile.agent             # Agent test
│   │   └── Dockerfile.app               # App test
│   ├── docker-compose.test.yml          # E2E test stack
│   └── scripts/
│       ├── run-agent.sh                 # Start agent
│       └── setup-agent.sh              # Setup agent
└── backend/
    ├── scripts/
    │   └── register-test-users.sh       # Register test users
    ├── prisma/
    │   ├── backup-20260610-110225.sql   # SQL backup
    │   └── migrations/                  # 5 migrations
    └── vitest.config.ts                 # Test config
```

---

> **Lưu ý:** Tài liệu này được tạo tự động bằng AI dựa trên phân tích source code. Cập nhật lần cuối: 10/06/2026.
