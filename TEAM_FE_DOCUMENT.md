# Phú Quốc Jobs — Tài liệu cho Team FE

*Cập nhật: 2026-06-09*

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Hướng dẫn bắt đầu](#2-hướng-dẫn-bắt-đầu)
3. [Hệ thống xác thực](#3-hệ-thống-xác-thực)
4. [API Reference](#4-api-reference)
5. [Database Schema](#5-database-schema)
6. [Known Issues](#6-known-issues)
7. [Docker & Database](#7-docker--database)
8. [Tài khoản test](#8-tài-khoản-test)

---

## 1. Tổng quan dự án

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js + React + TailwindCSS + shadcn/ui | 16.1.6 / 19 / 4 |
| Backend | NestJS + Prisma + PostgreSQL | 11 / 6 / 16 |
| Auth | better-auth (JWT + Session + Email OTP + Google OAuth) | 1.5 |
| AI Agent | Python FastAPI + LangGraph + CopilotKit | — |
| Cache | Redis | 7 |
| Events | Inngest | 4.4 |
| Payment | Stripe | 22.2 |

### Kiến trúc tổng quát

```mermaid
graph TB
    subgraph Browser["🌐 Browser"]
        FE["Next.js Frontend (Port 3001)<br/>─────────────────<br/>• Public Pages (SSR)<br/>• Candidate Dashboard (CSR)<br/>• Employer Dashboard (CSR)<br/>• AI CV Assistant (CopilotKit)"]
    end

    subgraph BFF["🔄 BFF Proxy (Next.js API Routes)"]
        V1["/api/v1/[...slug]<br/>→ Backend /api/v1/*"]
        AUTH["/api/auth/[...slug]<br/>→ Backend /api/auth/*"]
        AGENT["/api/agent/[...slug]<br/>→ Backend /api/v1/* + cookie verify"]
        CK["/api/copilotkit<br/>→ Python Agent"]
    end

    subgraph MW["🛡️ Middleware"]
        MID["middleware.ts<br/>─────────────────<br/>• /candidate/** → check cookie<br/>• /employer/** → check cookie<br/>• /auth/** → redirect if logged in"]
    end

    subgraph BE["⚙️ Backend NestJS (Port 3000)"]
        GUARD["Guard Chain<br/>─────────────────<br/>ThrottlerGuard → AuthGuard → RolesGuard"]
        MOD["15 Feature Modules<br/>─────────────────<br/>auth, users, companies, jobs,<br/>applications, resumes, notifications,<br/>categories, address, blogs,<br/>blog-categories, saved, pricing,<br/>payments, audit"]
        INFRA["6 Global Modules<br/>─────────────────<br/>PrismaModule, CacheModule,<br/>EmailModule, LoggerModule,<br/>InngestModule, SharedModule"]
    end

    subgraph Agent["🤖 AI Agent (Port 8125)"]
        PY["Python FastAPI + LangGraph<br/>─────────────────<br/>• CandidateAgent (CV tools)<br/>• RecruiterAgent (hiring tools)"]
    end

    subgraph DB["💾 Infrastructure"]
        PG[("PostgreSQL 16<br/>Port 5435<br/>22 tables")]
        RD[("Redis 7<br/>Port 6381<br/>Session + Cache")]
        ING["Inngest<br/>─────────────────<br/>Event Bus<br/>10 async functions"]
    end

    FE -->|"fetch + cookie"| V1
    FE -->|"auth"| AUTH
    FE -->|"CopilotKit"| CK
    V1 --> MID
    AUTH --> MID
    MID --> GUARD
    GUARD --> MOD
    MOD --> INFRA
    INFRA --> PG
    INFRA --> RD
    MOD --> ING
    CK --> PY
    AGENT --> GUARD
```

### Cấu trúc Monorepo

```
job-phuquoc/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # Auth module (better-auth)
│   │   ├── common/            # Shared infrastructure
│   │   │   ├── cache/         # Redis cache (@Global)
│   │   │   ├── email/         # Resend email (@Global)
│   │   │   ├── logger/        # Pino logger (@Global)
│   │   │   ├── dto/           # Response DTOs
│   │   │   ├── filters/       # GlobalExceptionFilter
│   │   │   └── interceptors/  # ResponseTransformInterceptor
│   │   ├── inngest/           # Event-driven system (@Global)
│   │   ├── prisma/            # Database (@Global)
│   │   └── modules/           # 15 feature modules
│   └── prisma/
│       ├── schema.prisma      # 22 tables, 10 enums
│       └── seed.ts            # Seed data
├── web/                        # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities
│   │   └── middleware.ts      # Route protection
│   └── agent/                 # Python AI Agent
├── docker/                     # Docker compose
├── scripts/                    # Backup & seed scripts
├── docs/                       # Documentation
└── ecosystem.config.js         # PM2 config
```

### Cài đặt

```bash
# 1. Clone repo
git clone <repo-url>
cd job-PhuQuoc

# 2. Install dependencies
pnpm install

# 3. Start database (PostgreSQL + Redis)
pnpm db:up

# 4. Copy env files
cp docker/.env.example backend/.env
cp docker/.env.example web/.env

# 5. Generate Prisma client + run migrations + seed data
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ..

# 6. Start all services
pnpm dev
```

### Cấu hình Environment Variables

Có 3 file `.env` cần cấu hình:

| File | Purpose |
|------|---------|
| `backend/.env` | Backend API (DB, Redis, Auth, Stripe, OpenAI) |
| `web/.env` | Frontend (API URL, Agent URL) |

**Template**: Copy từ `docker/.env.example`:

```bash
cp docker/.env.example backend/.env
cp docker/.env.example web/.env
```

### Bảng biến môi trường

#### Backend (`backend/.env`)

| Biến | Bắt buộc | Giá trị mặc định | Mô tả |
|------|----------|-------------------|-------|
| `DATABASE_URL` | ✅ | `postgresql://pq_user:pq_pass123@localhost:5435/pq_jobs` | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://localhost:6381` | Redis connection string |
| `BETTER_AUTH_SECRET` | ✅ | — | Secret key (32+ ký tự). Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | `http://localhost:3000` | Backend URL |
| `FRONTEND_URL` | ✅ | `http://localhost:3001` | Frontend URL (cho CORS) |
| `AGENT_URL` | ✅ | `http://localhost:8125` | Python AI agent URL |
| `INNGEST_DEV` | Optional | `1` | Bật Inngest dev mode |
| `RESEND_API_KEY` | Optional | — | Resend email API key |
| `EMAIL_FROM` | Optional | `onboarding@resend.dev` | Email sender |
| `GOOGLE_CLIENT_ID` | Optional | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | — | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Optional | — | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Optional | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Optional | — | Stripe webhook secret |

#### Frontend (`web/.env`)

| Biến | Bắt buộc | Giá trị mặc định | Mô tả |
|------|----------|-------------------|-------|
| `BACKEND_URL` | ✅ | `http://localhost:3000` | Backend URL (SSR calls) |
| `AGENT_URL` | ✅ | `http://localhost:8125` | Python AI agent URL |
| `OPENAI_API_KEY` | Cần AI | — | OpenAI API key (cho AI agent) |
| `NEXT_PUBLIC_COPILOTKIT_API_KEY` | Optional | — | CopilotKit public key |
| `COPILOTKIT_LICENSE_TOKEN` | Optional | — | CopilotKit license |
| `INTELLIGENCE_API_KEY` | Optional | — | CopilotKit Intelligence key |
| `INTELLIGENCE_API_URL` | Optional | — | Intelligence platform URL |
| `INTELLIGENCE_GATEWAY_WS_URL` | Optional | — | Intelligence gateway WebSocket URL |

### Lưu ý

- **`BETTER_AUTH_SECRET`**: Phải có ít nhất 32 ký tự. Dùng `openssl rand -base64 32` để generate.
- **`OPENAI_API_KEY`**: Cần cho AI Agent. Lấy từ https://platform.openai.com/api-keys
- **`NEXT_PUBLIC_*`**: Các biến có prefix `NEXT_PUBLIC_` được expose ra browser.
- **`BACKEND_URL`**: Dùng cho SSR calls từ Next.js server → Backend. Phải là URL mà server có thể truy cập được.
- **`AGENT_URL`**: URL của Python AI agent. Phải match với port trong `scripts/run-agent.sh`.
- **Không commit `.env`** lên git — đã có trong `.gitignore`.
- **Template**: Copy từ `docker/.env.example`: `cp docker/.env.example backend/.env && cp docker/.env.example web/.env`

### Lệnh hữu ích

```bash
# Services
pnpm dev              # Start all (backend + frontend + inngest + agent)
pnpm dev:stop         # Stop all
pnpm dev:restart      # Restart all
pnpm dev:logs         # Xem logs
pnpm dev:flush        # Xóa logs cũ + restart
pnpm dev:backend      # Logs backend
pnpm dev:frontend     # Logs frontend

# Database
pnpm db:up            # Start PostgreSQL + Redis
pnpm db:down          # Stop PostgreSQL + Redis
pnpm db:reset         # Reset DB + migrate + seed
pnpm db:studio        # Mở Prisma Studio (GUI)

# Migration (khi schema thay đổi)
cd backend
npx prisma generate        # Regenerate Prisma client
npx prisma migrate dev     # Tạo migration mới từ schema
npx prisma migrate reset   # Reset DB + chạy lại tất cả migrations
npx prisma db seed         # Chạy seed data
npx prisma studio          # Mở GUI xem/edit data
cd ..

# Build
pnpm build            # Build production (turbo)
```

### Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |
| PostgreSQL | localhost:5435 |
| Redis | localhost:6381 |

---

## 3. Hệ thống xác thực

### Cookie-based Auth

- **Cookie**: `better-auth.session_token` (HttpOnly)
- **Flow**: Login → Set cookie → Auto-sent with `credentials: "include"`

### Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Nhập email + password
    FE->>BE: POST /api/auth/sign-in/email
    BE->>DB: Verify password
    BE->>DB: Create session
    BE-->>FE: Set-Cookie + {user}
    FE->>FE: Redirect to dashboard

    Note over FE,BE: Subsequent requests
    FE->>BE: GET /api/v1/auth/me (cookie auto)
    BE->>DB: Verify session
    BE-->>FE: {user: {id, name, role}}
```

### Register Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend

    U->>FE: Nhập name, email, password, role
    FE->>BE: POST /api/auth/sign-up/email
    BE->>BE: Create user + account
    BE-->>FE: Set-Cookie
    FE->>BE: POST /api/auth/email-otp/send-verification-otp
    BE-->>FE: OTP sent
    U->>FE: Nhập OTP
    FE->>BE: POST /api/auth/email-otp/verify-email
    BE->>BE: emailVerified = true
    BE-->>FE: OK
```

### Route Protection (Middleware)

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as Middleware
    participant P as Page

    B->>MW: Request /candidate/dashboard
    MW->>MW: Check cookie exists?
    
    alt No cookie
        MW-->>B: Redirect /auth/login
    else Has cookie
        MW->>P: Allow access
        P-->>B: Render page
    end
```

---

## 4. API Reference

### Response Format

```json
// Success
{ "data": { ... }, "timestamp": "..." }

// Paginated
{ "data": { "items": [...], "total": 100, "page": 1, "limit": 10 }, "timestamp": "..." }

// Error
{ "statusCode": 400, "message": "...", "timestamp": "...", "path": "/api/v1/..." }
```

---

### 4.1 Jobs Module

#### GET /api/v1/jobs — Tìm kiếm việc làm

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    FE->>BE: GET /api/v1/jobs?search=React&type=FULL_TIME
    BE->>DB: Prisma query with filters
    DB-->>BE: Jobs with company, category, ward
    BE-->>FE: {data: {items: [...], total: 3130}}
    FE->>FE: Render job cards
```

**Query:** `search?, categoryId?, type?, experience?, level?, salaryMin?, salaryMax?, wardId?, page?, limit?`

**Response:**
```json
{
  "data": {
    "items": [{
      "id": "clx...",
      "title": "Lễ tân khách sạn",
      "salaryMin": 8000000,
      "salaryMax": 12000000,
      "type": "FULL_TIME",
      "status": "ACTIVE",
      "company": { "name": "...", "logo": "..." },
      "category": { "name": "...", "icon": "..." }
    }],
    "total": 3130
  }
}
```

---

#### GET /api/v1/jobs/slug/:slug — Chi tiết job

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    FE->>BE: GET /api/v1/jobs/slug/le-tan-khach-san
    BE->>DB: Find by slug + include relations
    DB-->>BE: Job with company, category, ward, requirements
    BE-->>FE: {data: {id, title, description, ...}}
    FE->>FE: Render job detail page
```

---

#### POST /api/v1/jobs — Tạo job

```mermaid
sequenceDiagram
    participant E as Employer
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    E->>FE: Fill job form
    FE->>BE: POST /api/v1/jobs<br/>{title, description, categoryId, ...}
    BE->>BE: Verify EMPLOYER role
    BE->>BE: Verify has company
    BE->>DB: Create job (status: DRAFT)
    BE-->>FE: {data: {id, slug, status: "DRAFT"}}
    FE->>FE: Redirect to checkout
```

---

### 4.2 Companies Module

#### GET /api/v1/companies — Danh sách công ty

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    FE->>BE: GET /api/v1/companies?limit=100
    BE->>DB: Query companies
    DB-->>BE: Companies with ward info
    BE-->>FE: {data: {items: [...], total: 80}}
    FE->>FE: Render company cards
```

---

#### POST /api/v1/companies — Tạo công ty

```mermaid
sequenceDiagram
    participant E as Employer
    participant FE as Frontend
    participant BE as Backend

    E->>FE: Fill company form
    FE->>BE: POST /api/v1/companies<br/>{name, description, industry, ...}
    BE->>BE: Verify EMPLOYER role
    BE->>BE: Create company (isApproved: true)
    BE-->>FE: {data: {id, slug}}
```

---

### 4.3 Applications Module

#### POST /api/v1/applications — Ứng tuyển

```mermaid
sequenceDiagram
    participant C as Candidate
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    C->>FE: Click "Apply" on job
    FE->>FE: Show modal (select resume + cover letter)
    FE->>BE: POST /api/v1/applications<br/>{jobId, resumeId, coverLetter}
    BE->>BE: Verify CANDIDATE role
    BE->>BE: Verify job is ACTIVE
    BE->>BE: Check not already applied
    BE->>DB: Create application
    BE->>BE: Inngest: application.created
    BE-->>FE: {data: {id, status: "PENDING"}}
    FE->>FE: Show success toast
```

---

#### PATCH /api/v1/applications/:id/status — Duyệt đơn

```mermaid
sequenceDiagram
    participant E as Employer
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    E->>FE: Click "Accept" on application
    FE->>BE: PATCH /api/v1/applications/:id/status<br/>{status: "ACCEPTED"}
    BE->>BE: Verify EMPLOYER owns company
    BE->>BE: Validate status transition
    BE->>DB: Update status
    BE->>BE: Inngest: application.accepted
    BE-->>FE: {data: {id, status: "ACCEPTED"}}
    FE->>FE: Update UI
```

---

### 4.4 Resumes Module

#### POST /api/v1/resumes — Tạo CV

```mermaid
sequenceDiagram
    participant C as Candidate
    participant FE as Frontend
    participant BE as Backend

    C->>FE: Fill resume form
    FE->>BE: POST /api/v1/resumes<br/>{title, templateId, skills, education, ...}
    BE->>BE: Verify CANDIDATE role
    BE->>BE: Verify template exists
    BE->>BE: If isDefault, unset others
    BE-->>FE: {data: {id}}
    FE->>FE: Redirect to resume detail
```

---

#### GET /api/v1/resumes/:id/render — Render CV

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    FE->>BE: GET /api/v1/resumes/:id/render
    BE->>DB: Fetch resume + template + user
    BE->>BE: Template engine: interpolate {{fields}}
    BE-->>FE: {data: {html: "<html>...</html>"}}
    FE->>FE: Render in iframe
```

---

#### GET /api/v1/resumes/:id/pdf — Export PDF

```mermaid
sequenceDiagram
    participant C as Candidate
    participant FE as Frontend
    participant BE as Backend

    C->>FE: Click "Export PDF"
    FE->>BE: GET /api/v1/resumes/:id/pdf
    BE->>BE: Puppeteer: open print page
    BE->>BE: Generate A4 PDF
    BE-->>FE: Binary PDF file
    FE->>FE: Download file
```

---

### 4.5 Payments Module

#### POST /api/v1/payments/checkout — Thanh toán

```mermaid
sequenceDiagram
    participant E as Employer
    participant FE as Frontend
    participant BE as Backend
    participant Stripe as Stripe

    E->>FE: Select pricing package
    FE->>BE: POST /api/v1/payments/checkout<br/>{jobId, packageId}
    BE->>BE: Verify job is DRAFT
    BE->>BE: Verify employer owns company
    BE->>Stripe: Create checkout session
    BE-->>FE: {url: "https://checkout.stripe.com/..."}
    FE->>E: Redirect to Stripe
```

---

#### Payment Webhook Flow

```mermaid
sequenceDiagram
    participant Stripe as Stripe
    participant BE as Backend
    participant DB as Database

    Stripe->>BE: POST /api/v1/payments/webhook
    BE->>BE: Verify signature
    BE->>DB: Update payment → COMPLETED
    BE->>DB: Update job → ACTIVE + deadline
    BE->>BE: Inngest: job.activated
    BE-->>Stripe: {received: true}
```

---

#### Dev Mock Payment

```mermaid
sequenceDiagram
    participant E as Employer
    participant FE as Frontend
    participant BE as Backend

    E->>FE: Click "Pay" (dev mode)
    FE->>BE: POST /api/v1/payments/checkout
    BE-->>FE: {url, gateway: "mock"}
    FE->>E: Redirect to /payment/success
    FE->>BE: POST /api/v1/payments/mock-complete<br/>{jobId}
    BE->>BE: Activate job
    BE-->>FE: {message: "Payment completed"}
```

---

### 4.6 Notifications Module

#### GET /api/v1/notifications

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: GET /api/v1/notifications?limit=50
    BE-->>FE: {data: {items: [{id, type, title, content, isRead}]}}
    FE->>FE: Render notification list
```

---

#### PATCH /api/v1/notifications/read-all

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: PATCH /api/v1/notifications/read-all
    BE->>BE: Mark all as read
    BE-->>FE: {message: "All marked as read"}
```

---

### 4.7 Blogs Module

#### GET /api/v1/blogs — Danh sách blog

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: GET /api/v1/blogs?limit=50
    BE-->>FE: {data: {items: [{id, title, slug, excerpt, author, category}]}}
    FE->>FE: Render blog cards
```

---

#### GET /api/v1/blogs/slug/:slug — Chi tiết blog

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: GET /api/v1/blogs/slug/:slug
    BE->>BE: Increment view count
    BE-->>FE: {data: {id, title, content, author, category, views}}
    FE->>FE: Render blog detail
```

---

### 4.8 Saved Module

#### POST /api/v1/saved/jobs/:jobId — Toggle lưu job

```mermaid
sequenceDiagram
    participant C as Candidate
    participant FE as Frontend
    participant BE as Backend

    C->>FE: Click bookmark icon
    FE->>BE: POST /api/v1/saved/jobs/:jobId
    BE->>BE: Toggle save/unsave
    BE-->>FE: {saved: true}
    FE->>FE: Update bookmark icon
```

---

### 4.9 Pricing Module

#### GET /api/v1/pricing

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: GET /api/v1/pricing?active=true
    BE-->>FE: [{id, name, days, price, isActive}]
    FE->>FE: Render pricing cards
```

---

### 4.10 Address Module

#### GET /api/v1/address/wards

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: GET /api/v1/address/wards?limit=50
    BE-->>FE: [{id, name, district: {name, province: {name}}}]
    FE->>FE: Populate location dropdown
```

---

### 4.11 Users Module (Admin)

#### GET /api/v1/users

```mermaid
sequenceDiagram
    participant A as Admin
    participant FE as Frontend
    participant BE as Backend

    A->>FE: View users list
    FE->>BE: GET /api/v1/users?page=1&limit=10
    BE-->>FE: {data: {items: [{id, name, email, role, isActive}]}}
```

---

### 4.12 AI CV Assistant

#### Tạo CV qua Chat

```mermaid
sequenceDiagram
    participant U as User
    participant Chat as CopilotChat
    participant Agent as AI Agent
    participant BE as Backend

    U->>Chat: "Tạo CV Frontend Developer"
    Chat->>Agent: Send message
    Agent->>Agent: Ask for info (experience, skills, ...)
    U->>Chat: "2 năm React, ABC Tech..."
    Agent->>Agent: generate_cv_template tool
    Agent->>Agent: Generate HTML with OpenAI
    Agent-->>Chat: CV preview (iframe)
    U->>Chat: "Lưu CV"
    Agent->>Agent: save_resume tool
    Agent->>BE: POST /api/v1/resumes
    BE-->>Agent: {id: "..."}
    Agent-->>Chat: "Đã lưu CV! Export PDF?"
```

---

## 5. Database Schema

### ER Diagram

```mermaid
erDiagram
    user ||--o{ account : "has"
    user ||--o{ session : "has"
    user ||--o{ Company : "owns"
    user ||--o{ JobApplication : "applies"
    user ||--o{ CandidateResume : "has"
    user ||--o{ Notification : "receives"
    user ||--o{ SavedJob : "saves"
    user ||--o{ SavedCompany : "saves"
    user ||--o{ BlogPost : "authors"
    user ||--o{ Payment : "makes"

    Company ||--o{ Job : "posts"
    Job ||--o{ JobApplication : "receives"
    JobCategory ||--o{ Job : "categorizes"
    AddressWard ||--o{ Company : "located in"
    AddressWard ||--o{ Job : "located in"
    CandidateResume ||--o{ JobApplication : "attached to"
    ResumeTemplate ||--o{ CandidateResume : "uses"
    BlogCategory ||--o{ BlogPost : "categorizes"
    PricingPackage ||--o{ Payment : "purchased via"
```

### Enums

| Enum | Values |
|------|--------|
| Role | CANDIDATE, EMPLOYER, ADMIN |
| JobType | FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP, FREELANCE |
| JobStatus | DRAFT, PENDING, ACTIVE, CLOSED |
| ApplicationStatus | PENDING, REVIEWING, ACCEPTED, REJECTED |
| NotificationType | APPLICATION_RECEIVED, APPLICATION_ACCEPTED, APPLICATION_REJECTED, JOB_APPROVED, COMPANY_APPROVED, JOB_DEADLINE, SYSTEM |
| PaymentStatus | PENDING, COMPLETED, FAILED, REFUNDED |

---

### 5.2 Bảng tổng hợp tất cả Endpoints (82 endpoints)

#### Auth — better-auth (10 endpoints, `/api/auth/*`)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 1 | POST | /api/auth/sign-up/email | Public | Đăng ký (name, email, password, role) |
| 2 | POST | /api/auth/sign-in/email | Public | Đăng nhập → Set cookie |
| 3 | POST | /api/auth/sign-out | Session | Đăng xuất |
| 4 | GET | /api/auth/token | Session | Lấy JWT token |
| 5 | GET | /api/auth/jwks | Public | Public keys (JWKS) |
| 6 | POST | /api/auth/sign-in/social/google | Public | Google OAuth |
| 7 | POST | /api/auth/email-otp/send-verification-otp | Public | Gửi OTP xác nhận email |
| 8 | POST | /api/auth/email-otp/verify-email | Public | Xác nhận OTP |
| 9 | POST | /api/auth/email-otp/request-password-reset | Public | Gửi OTP reset password |
| 10 | POST | /api/auth/email-otp/reset-password | Public | Đặt lại password |

#### Auth — Custom (6 endpoints, `/api/v1/auth/*` + `/api/v1/scalar-auth/*`)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 11 | GET | /api/v1/auth/me | AUTH | Lấy profile hiện tại |
| 12 | PATCH | /api/v1/auth/me | AUTH | Cập nhật profile |
| 13 | GET | /api/v1/auth/admin-only | ADMIN | Test endpoint admin |
| 14 | POST | /api/v1/scalar-auth/login | Public | Proxy login cho Scalar docs |
| 15 | POST | /api/v1/scalar-auth/register | Public | Proxy register cho Scalar docs |
| 16 | POST | /api/v1/scalar-auth/logout | Public | Proxy logout cho Scalar docs |

#### Users (6 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 17 | GET | /api/v1/users | ADMIN | Danh sách user |
| 18 | GET | /api/v1/users/:id | ADMIN | Chi tiết user |
| 19 | PATCH | /api/v1/users/:id | AUTH(self/ADMIN) | Cập nhật user |
| 20 | PATCH | /api/v1/users/:id/toggle-active | ADMIN | Bật/tắt active |
| 21 | PATCH | /api/v1/users/:id/toggle-lock | ADMIN | Khóa/mở khóa |
| 22 | DELETE | /api/v1/users/:id | ADMIN | Xóa user |

#### Companies (7 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 23 | GET | /api/v1/companies | Public | Danh sách công ty |
| 24 | GET | /api/v1/companies/slug/:slug | Public | Chi tiết theo slug |
| 25 | GET | /api/v1/companies/my | EMPLOYER | Công ty của tôi |
| 26 | GET | /api/v1/companies/:id | Public | Chi tiết theo ID |
| 27 | POST | /api/v1/companies | EMPLOYER | Tạo công ty |
| 28 | PATCH | /api/v1/companies/:id | OWNER | Cập nhật công ty |
| 29 | DELETE | /api/v1/companies/:id | ADMIN | Xóa công ty |

#### Jobs (7 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 30 | GET | /api/v1/jobs | Public | Tìm kiếm việc làm |
| 31 | GET | /api/v1/jobs/my | EMPLOYER | Jobs của tôi |
| 32 | GET | /api/v1/jobs/slug/:slug | Public | Chi tiết theo slug |
| 33 | GET | /api/v1/jobs/:id | Public | Chi tiết theo ID |
| 34 | POST | /api/v1/jobs | EMPLOYER | Tạo job (DRAFT) |
| 35 | PATCH | /api/v1/jobs/:id | OWNER | Cập nhật job |
| 36 | DELETE | /api/v1/jobs/:id | ADMIN | Xóa job |

#### Applications (7 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 37 | POST | /api/v1/applications | CANDIDATE | Ứng tuyển |
| 38 | GET | /api/v1/applications/my | CANDIDATE | Đơn của tôi |
| 39 | GET | /api/v1/applications/employer | EMPLOYER | Đơn cho employer |
| 40 | GET | /api/v1/applications/job/:jobId | EMPLOYER | Đơn theo job |
| 41 | PATCH | /api/v1/applications/:id/status | EMPLOYER | Cập nhật trạng thái |
| 42 | PATCH | /api/v1/applications/:id/bookmark | EMPLOYER | Toggle bookmark |
| 43 | DELETE | /api/v1/applications/:id | CANDIDATE | Rút đơn |

#### Resumes (13 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 44 | GET | /api/v1/resumes/templates | Public | Danh sách templates |
| 45 | GET | /api/v1/resumes/templates/:id | Public | Chi tiết template |
| 46 | POST | /api/v1/resumes/templates | CANDIDATE | Tạo template |
| 47 | PATCH | /api/v1/resumes/templates/:id | CANDIDATE | Sửa template |
| 48 | DELETE | /api/v1/resumes/templates/:id | CANDIDATE | Xóa template |
| 49 | GET | /api/v1/resumes/my | CANDIDATE | CV của tôi |
| 50 | GET | /api/v1/resumes/:id | OWNER | Chi tiết CV |
| 51 | GET | /api/v1/resumes/:id/render | OWNER | Render CV HTML |
| 52 | POST | /api/v1/resumes/render-template | Public | Render template preview |
| 53 | GET | /api/v1/resumes/:id/pdf | OWNER | Export PDF |
| 54 | POST | /api/v1/resumes | CANDIDATE | Tạo CV |
| 55 | PATCH | /api/v1/resumes/:id | OWNER | Sửa CV |
| 56 | DELETE | /api/v1/resumes/:id | OWNER | Xóa CV |

#### Notifications (4 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 57 | GET | /api/v1/notifications | AUTH | Thông báo của tôi |
| 58 | GET | /api/v1/notifications/unread-count | AUTH | Số chưa đọc |
| 59 | PATCH | /api/v1/notifications/:id/read | AUTH | Đánh dấu đã đọc |
| 60 | PATCH | /api/v1/notifications/read-all | AUTH | Đọc tất cả |

#### Categories (5 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 61 | GET | /api/v1/categories | Public | Danh mục nghề |
| 62 | GET | /api/v1/categories/:id | Public | Chi tiết |
| 63 | POST | /api/v1/categories | ADMIN | Tạo danh mục |
| 64 | PATCH | /api/v1/categories/:id | ADMIN | Sửa danh mục |
| 65 | DELETE | /api/v1/categories/:id | ADMIN | Xóa danh mục |

#### Address (5 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 66 | GET | /api/v1/address/provinces | Public | Tỉnh/thành |
| 67 | GET | /api/v1/address/provinces/:id/districts | Public | Quận/huyện |
| 68 | GET | /api/v1/address/districts/:id/wards | Public | Phường/xã |
| 69 | GET | /api/v1/address/wards | Public | Tất cả phường/xã |
| 70 | GET | /api/v1/address/wards/:id | Public | Địa chỉ đầy đủ |

#### Blogs (5 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 71 | GET | /api/v1/blogs | Public | Danh sách blog |
| 72 | GET | /api/v1/blogs/slug/:slug | Public | Chi tiết blog |
| 73 | POST | /api/v1/blogs | ADMIN | Tạo blog |
| 74 | PATCH | /api/v1/blogs/:id | ADMIN | Sửa blog |
| 75 | DELETE | /api/v1/blogs/:id | ADMIN | Xóa blog |

#### Blog Categories (4 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 76 | GET | /api/v1/blog-categories | Public | Danh mục blog |
| 77 | POST | /api/v1/blog-categories | ADMIN | Tạo danh mục |
| 78 | PATCH | /api/v1/blog-categories/:id | ADMIN | Sửa danh mục |
| 79 | DELETE | /api/v1/blog-categories/:id | ADMIN | Xóa danh mục |

#### Saved (4 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 80 | POST | /api/v1/saved/jobs/:jobId | CANDIDATE | Toggle lưu job |
| 81 | GET | /api/v1/saved/jobs | CANDIDATE | Jobs đã lưu |
| 82 | POST | /api/v1/saved/companies/:companyId | CANDIDATE | Toggle lưu company |
| 83 | GET | /api/v1/saved/companies | CANDIDATE | Companies đã lưu |

#### Pricing (5 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 84 | GET | /api/v1/pricing | Public | Danh sách gói |
| 85 | GET | /api/v1/pricing/:id | Public | Chi tiết gói |
| 86 | POST | /api/v1/pricing | ADMIN | Tạo gói |
| 87 | PATCH | /api/v1/pricing/:id | ADMIN | Sửa gói |
| 88 | DELETE | /api/v1/pricing/:id | ADMIN | Xóa gói |

#### Payments (5 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 89 | POST | /api/v1/payments/checkout | EMPLOYER | Tạo checkout |
| 90 | POST | /api/v1/payments/webhook | Public | Stripe webhook |
| 91 | POST | /api/v1/payments/mock-complete | EMPLOYER | Mock thanh toán (dev) |
| 92 | GET | /api/v1/payments/my | EMPLOYER | Lịch sử thanh toán |
| 93 | GET | /api/v1/payments/:id | EMPLOYER/ADMIN | Chi tiết payment |

#### Audit (2 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 94 | GET | /api/v1/audit | ADMIN | Nhật ký hệ thống |
| 95 | GET | /api/v1/audit/:id | ADMIN | Chi tiết log |

#### Inngest (2 endpoints)

| # | Method | Path | Auth | Mô tả |
|---|--------|------|------|-------|
| 96 | GET | /api/inngest | Public | Health check |
| 97 | POST | /api/inngest | Public | Webhook endpoint |

---

## 6. Known Issues

> **Chi tiết tất cả bugs xem tại:** [docs/PROJECT_ISSUES.md](./docs/PROJECT_ISSUES.md)

### FE Issues (cần fix ngay)

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | 🔴 Critical | Login page `setError` crash | `auth/login/page.tsx:132,151` |
| 2 | 🔴 Critical | Homepage JobCard link 404 | `components/candidate/JobCard.tsx:39` |
| 3 | 🔴 Critical | Companies CTA link `/register` sai | `companies/CompaniesPageClient.tsx:145` |
| 4 | 🔴 Critical | Employer registration broken | `auth/register/page.tsx:61` |
| 5 | 🟡 Significant | Apply modal upload không gửi file | `jobs/[slug]/JobDetailClient.tsx:355` |
| 6 | 🟡 Significant | Homepage SearchBar không hoạt động | `components/candidate/SearchBar.tsx:146` |
| 7 | 🟡 Moderate | Employer jobs hiển thị raw enum | `employer/jobs/page.tsx:79` |
| 8 | 🟡 Moderate | Dashboard `jobType` vs `type` mismatch | `candidate/dashboard/page.tsx:175` |

### BE Issues (cần fix)

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | 🔴 Critical | Mock webhook payment bypass | `payments.service.ts:85` |
| 2 | 🔴 Critical | Admin role escalation qua registration | `auth.ts:118` |
| 3 | 🟢 Significant | XSS qua template data interpolation | `template-engine.service.ts:100` |
| 4 | 🟢 Significant | Public job listing leak DRAFT | `jobs.controller.ts:15` |

---

## 7. Docker & Database

### Docker Compose

```bash
docker compose -f docker/docker-compose.yml up -d     # Start
docker compose -f docker/docker-compose.yml down       # Stop
```

### Backup

```bash
./scripts/backup-db.sh ./backup    # Backup → JSON files
```

### Import

```bash
cd backend
npx ts-node ../scripts/seed-from-backup.ts ../backup
```

---

## 8. Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Candidate | `candidate@phuquoc.jobs` | `Candidate123!` |
| Employer | `employer@phuquoc.jobs` | `Employer123!` |

---

## 9. Prisma Migrations

### Khi nào cần migration?

Khi sửa file `backend/prisma/schema.prisma` (thêm/sửa/xóa field, table, enum).

### Lệnh migration

```bash
cd backend

# Tạo migration mới (tự generate SQL)
npx prisma migrate dev --name ten_migration

# Regenerate Prisma client (sau khi pull code mới)
npx prisma generate

# Reset DB + chạy lại tất cả migrations (mất data!)
npx prisma migrate reset --force

# Seed data mẫu
npx prisma db seed

cd ..
```

### Lưu ý

- **Không push folder `migrations/`** lên git — mỗi dev tự generate từ schema
- **Luôn chạy `npx prisma generate`** sau khi pull code mới
- **`npx prisma migrate reset`** sẽ xóa toàn bộ data — chỉ dùng khi cần reset
- **`npx prisma studio`** mở GUI xem/edit data trực tiếp

---

## 10. Nguyên tắc viết Module mới (Modular Monolith)

> Chi tiết tại: [docs/MODULAR_MONOLITH_GUIDE.md](./docs/MODULAR_MONOLITH_GUIDE.md)

**Tóm tắt nhanh:**

```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── dto/
```

**Quy tắc:**
- ✅ Cross-module query → SharedModule Contracts
- ✅ Async events → Inngest
- ❌ Import trực tiếp module khác
