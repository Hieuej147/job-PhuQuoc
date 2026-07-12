# Phú Quốc Jobs — Backend API

Backend API cho website tìm việc làm tại Phú Quốc, xây dựng với NestJS theo kiến trúc Modular Monolith.

## Công nghệ

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | NestJS | 11 |
| Language | TypeScript | 5.7 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 16 |
| Cache/Session | Redis (ioredis) | 5.4 |
| Auth | better-auth | 1.5 |
| Email | Resend | 6.12 |
| Async Events | Inngest | 4.4 |
| Payment | Stripe | 22.2 |
| API Docs | Scalar | — |
| Testing | Vitest + Supertest | 3.0 |

---

## Cập nhật quan trọng 09/07/2026

- Prisma đang dùng **Prisma 7** và `prisma.config.ts`; datasource URL không đặt trong `schema.prisma`.
- Quota đã tách theo NestJS DI:
  - `common/quota/quota.service.ts`: application service dùng trong request flow, inject `PrismaService` + `InngestService`.
  - `common/quota/quota-expiry.service.ts`: helper cho Inngest expiry/repair, dùng Prisma trực tiếp, không giả lập Nest DI.
  - `common/quota/storage-quota.ts` đã xoá; không import lại file này.
- `QuotaModule` export `QuotaService`; module nào check quota phải import `QuotaModule`, không tự `new QuotaService()`.
- Job user-facing delete của employer là **archive mềm**, không hard delete. Dữ liệu job/payment/application/quota purchase giữ lại cho admin/support.
- Application user-facing delete chỉ set `candidateDeletedAt` hoặc `employerDeletedAt`, không xoá vật lý.
- `Job.deadline` chỉ set từ checkout/payment duration. Create/update job DTO không nhận deadline.
- Job embedding chỉ sync sau khi payment completion kích hoạt job thành `ACTIVE`, hoặc khi employer sửa một job đang `ACTIVE`, chưa hết hạn và chưa archive. Tạo job `DRAFT` không chạy embedding.
- Chat application chỉ gửi được khi application `ACCEPTED` và chưa đóng; `REJECTED` chỉ xem lời nhắn read-only.

## Kiến trúc tổng quan

Backend hiện là **Modular Monolith theo bounded context**. Không tách microservice sớm; thay vào đó mỗi module được tách layer nội bộ theo hướng trong `docs/BE_ARCHITECTURE_PRODUCTION_AWS_REVIEW*.md`.

### Layer chuẩn trong mỗi module

| Layer | Vị trí | Trách nhiệm |
|---|---|---|
| Presentation | `*.controller.ts`, `dto/` | HTTP route, params/query/body, DTO validation, auth decorators. |
| Application | `application/`, hoặc service chính khi module còn nhỏ | Use case orchestration, transaction workflow, authorization orchestration, state transition flow. |
| Domain | function/constant gần use case hoặc `domain/` khi phình to | State machine, ownership rules, invariants, policy thuần business. |
| Infrastructure | `infrastructure/`, `gateways/`, provider adapter | Adapter ra hệ thống ngoài như Inngest, Stripe, Cloudinary/S3, email, model provider. |
| Background | `background/` hoặc `src/inngest/functions/` | Công việc non-blocking, scheduled jobs, retry-safe handlers. |
| Data | `PrismaService`, `CacheService`, shared contracts | PostgreSQL/Redis access và query contract giữa module. |

Ví dụ đã áp dụng:

- `applications/infrastructure/application-events.publisher.ts`: publish application events ra Inngest, không để `ApplicationsService` gọi event bus trực tiếp.
- `jobs/background/job-background.service.ts`: sync embedding chạy nền sau paid activation hoặc active-job edit, không block request response.
- `payments/application/payment-completion.service.ts`: use case hoàn tất payment; DB transaction cập nhật payment + active job trước, sau đó emit event, audit best-effort và sync embedding.
- `common/quota/quota.service.ts`: quota application service trong Nest request flow.
- `common/quota/quota-expiry.service.ts`: quota expiry/repair helper cho Inngest, không phụ thuộc `InngestService`.

Quy tắc maintain:

- Controller không gọi Prisma/cache/event bus trực tiếp.
- Service chính của module chỉ nên điều phối use case public của module.
- Cross-module read đi qua `modules/shared/contracts`.
- Cross-module side effect đi qua event hoặc application use case rõ ràng.
- Infrastructure adapter phải thay được khi đổi provider, ví dụ Stripe/mock, Cloudinary/S3, Inngest/EventBridge.
- Background work phải non-blocking với request path và có log khi fail.

### Hệ thống phân tầng

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │  Next.js FE   │    │  Mobile App   │    │  AI Agent     │       │
│  │  (port 3001)  │    │  (React Native)│   │  (Python)     │       │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘       │
│          │ Cookie             │ JWT                │ JWT            │
└──────────┼────────────────────┼────────────────────┼────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        GATEWAY LAYER                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    NestJS Middleware Chain                    │   │
│  │                                                              │   │
│  │  CORS ──► Rate Limit ──► Body Parser ──► Cookie Parser      │   │
│  │  (100 req/min)          (JSON + raw)     (session token)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Guard Chain (Sequential)                  │   │
│  │                                                              │   │
│  │  AuthGuard ──────────► RolesGuard ──────────► Controller    │   │
│  │  │                    │                                       │   │
│  │  │ Check:             │ Check:                                │   │
│  │  │ - @Public()?       │ - @Roles() decorator                 │   │
│  │  │ - Bearer JWT       │ - user.role in allowedRoles?         │   │
│  │  │ - Session cookie   │ - Default: CANDIDATE if null         │   │
│  │  │ - isActive?        │                                       │   │
│  │  │ - isLocked?        │                                       │   │
│  │  │ - DB check (JWT)   │                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Interceptor + Filter                      │   │
│  │                                                              │   │
│  │  ResponseTransformInterceptor: { data: T, timestamp }       │   │
│  │  GlobalExceptionFilter: { statusCode, message, path }       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MODULE LAYER (15 modules)                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     AUTH MODULE                              │   │
│  │  better-auth + JWT + Session + OTP + Google OAuth           │   │
│  │  Guards: AuthGuard (APP_GUARD), RolesGuard (APP_GUARD)     │   │
│  │  Decorators: @Public(), @Roles(), @CurrentUser()           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    BUSINESS MODULES                          │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │  USERS   │ │COMPANIES │ │   JOBS   │ │APPLICATIONS│    │   │
│  │  │          │ │          │ │          │ │          │      │   │
│  │  │ CRUD     │ │ CRUD     │ │ CRUD     │ │ CRUD     │      │   │
│  │  │ Toggle   │ │ Approval │ │ Status   │ │ Status   │      │   │
│  │  │ Lock     │ │          │ │ Machine  │ │ Machine  │      │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │ RESUMES  │ │  BLOGS   │ │ CATEGORIES│ │  SAVED   │      │   │
│  │  │          │ │          │ │          │ │          │      │   │
│  │  │ CRUD     │ │ CRUD     │ │ CRUD     │ │ Toggle   │      │   │
│  │  │ Data API │ │ Publish  │ │ Cascade  │ │ Jobs     │      │   │
│  │  │ Templates│ │ Views    │ │ Protect  │ │ Companies│      │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │NOTIFICA- │ │ PRICING  │ │ PAYMENTS │ │  AUDIT   │      │   │
│  │  │  TIONS   │ │          │ │          │ │          │      │   │
│  │  │          │ │          │ │          │ │          │      │   │
│  │  │ CRUD     │ │ CRUD     │ │ Stripe   │ │ Read-only│      │   │
│  │  │ Read/Unr │ │          │ │ Webhook  │ │ Logs     │      │   │
│  │  │ Mark All │ │          │ │ Mock     │ │          │      │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SHARED MODULE                             │   │
│  │                                                              │   │
│  │  Contract Services (Read-only cross-module queries):        │   │
│  │  - JobContractService: findById, findBySlug                │   │
│  │  - CompanyContractService: findById, findByOwnerId          │   │
│  │  - PricingContractService: findById, findActive             │   │
│  │  - PaymentContractService: findById, findByJobId            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Rules:                                                             │
│  ✅ Cross-module via Inngest events (async)                        │
│  ✅ Cross-module queries via Shared contracts (sync, read-only)    │
│  ✅ Heavy/non-critical work via background/application layer        │
│  ✅ PrismaModule @Global() - inject anywhere                      │
│  ❌ Direct module service imports (forbidden)                      │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                              │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │PostgreSQL│ │  Redis   │ │ Inngest  │ │  Stripe  │ │  Resend  ││
│  │          │ │          │ │          │ │          │ │          ││
│  │ Primary  │ │ Session  │ │ Events   │ │ Payments │ │ Email    ││
│  │ Database │ │ Cache    │ │ Async    │ │ Gateway  │ │ OTP      ││
│  │ 27 tables│ │ TTL 5min │ │ 12 funcs │ │ Webhook  │ │ Verify   ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                                     │
│  ┌──────────┐ ┌──────────┐                                        │
│  │  Google  │ │Cloudinary│                                        │
│  │  OAuth   │ │Uploads   │                                        │
│  └──────────┘ └──────────┘                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCY GRAPH                       │
│                                                                  │
│                        ┌─────────┐                              │
│                        │  SHARED │                              │
│                        │(contracts)│                            │
│                        └────┬────┘                              │
│                             │                                    │
│        ┌────────────────────┼────────────────────┐              │
│        │                    │                    │              │
│        ▼                    ▼                    ▼              │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│  │   JOBS   │◄──────►│COMPANIES │        │  PRICING │          │
│  └────┬─────┘        └────┬─────┘        └────┬─────┘          │
│       │                   │                    │                │
│       ▼                   ▼                    ▼                │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│  │APPLICATIONS│       │  USERS   │        │ PAYMENTS │          │
│  └────┬─────┘        └────┬─────┘        └────┬─────┘          │
│       │                   │                    │                │
│       ▼                   ▼                    ▼                │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│  │NOTIFICA- │        │ RESUMES  │        │  AUDIT   │          │
│  │  TIONS   │        └──────────┘        └──────────┘          │
│  └──────────┘                                                   │
│                                                                  │
│  Communication:                                                  │
│  ──────────────                                                  │
│  Sync:  Via Shared contracts (read-only queries)                │
│  Async: Via Inngest events (notifications, audit, etc.)         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  INNGEST EVENT BUS                       │    │
│  │                                                          │    │
│  │  application.created ──────► notification (employer)    │    │
│  │  application.accepted ─────► notification (candidate)   │    │
│  │  application.rejected ─────► notification (candidate)   │    │
│  │  job.activated ────────────► notification (employer)    │    │
│  │  job.activated ────────────► schedule expiry events     │    │
│  │  job.expiring-soon ────────► notification (saved users) │    │
│  │  job.expired ──────────────► auto-close + notification  │    │
│  │  user.registered ──────────► welcome notification       │    │
│  │  audit/* ──────────────────► write AuditLog             │    │
│  │  weekly-employer-summary ──► summary notification       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Request Flow (Chi tiết)

```
Client Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. MIDDLEWARE CHAIN                                              │
│    ├── CORS check (FRONTEND_URL whitelist)                      │
│    ├── Rate limiting (100 req/min per IP)                       │
│    ├── Body parser (JSON + raw for Stripe webhook)              │
│    └── Cookie parser (better-auth.session_token)                │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GUARD CHAIN                                                   │
│    ├── AuthGuard                                                │
│    │   ├── @Public()? → skip auth                               │
│    │   ├── Bearer token? → JWT verify + DB isActive/isLocked   │
│    │   ├── Session cookie? → better-auth getSession + expiry   │
│    │   └── None? → 401 Unauthorized                            │
│    │                                                            │
│    └── RolesGuard                                               │
│        ├── Get user.role from request.user                      │
│        ├── @Roles() specified? → check role in list            │
│        ├── No @Roles()? → allow any authenticated user         │
│        └── role null? → deny protected role routes              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER                                                    │
│    ├── Parse params (@Param, @Query, @Body)                    │
│    ├── Validate DTOs (class-validator)                          │
│    └── Call service method                                      │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICE                                                       │
│    ├── Application orchestration                                │
│    ├── Domain rule validation                                   │
│    ├── Shared contract reads if another module owns the data    │
│    ├── Infrastructure adapter calls if needed                   │
│    ├── Background publisher for non-critical side effects       │
│    └── Return result                                            │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. INTERCEPTOR                                                   │
│    └── ResponseTransformInterceptor: { data: T, timestamp }    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. EXCEPTION FILTER (if error)                                   │
│    └── GlobalExceptionFilter: { statusCode, message, path }    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
Client Response
```

---

### Auth Flow (Chi tiết)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL/PASSWORD REGISTER                      │
│                                                                  │
│  Client                  Backend                   better-auth  │
│    │                       │                           │        │
│    │ POST /auth/register-email │                       │        │
│    │ {name,email,pass,role}│                           │        │
│    │──────────────────────►│                           │        │
│    │                       │ before hook:              │        │
│    │                       │ - Validate role           │        │
│    │                       │ - Require CANDIDATE/EMPLOYER │     │
│    │                       │                           │        │
│    │                       │ createUser() ────────────►│        │
│    │                       │                           │        │
│    │                       │ createSession             │        │
│    │                       │──────────────────────────►│        │
│    │                       │                           │        │
│    │                       │ Send verification OTP     │        │
│    │◄──────────────────────│                           │        │
│    │                       │                           │        │
│    │ [User enters OTP]     │                           │        │
│    │                       │                           │        │
│    │ POST /auth/complete-email-registration │          │        │
│    │──────────────────────►│                           │        │
│    │                       │ Verify OTP + hash password│        │
│    │                       │ Set emailVerified=true    │        │
│    │◄──────────────────────│                           │        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       GOOGLE OAUTH                               │
│                                                                  │
│  Client                  Backend                   better-auth  │
│    │                       │                           │        │
│    │ POST /sign-in/social/google                     │        │
│    │──────────────────────►│                           │        │
│    │                       │ Create/link OAuth user    │        │
│    │                       │ role=null for new user    │        │
│    │                       │ Set-Cookie: session_token │        │
│    │◄──────────────────────│                           │        │
│    │                       │ GET /api/v1/auth/me       │        │
│    │                       │──────────────────────────►│        │
│    │                       │ role=null → FE /select-role │      │
│    │                       │ role set → dashboard      │        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                    │
│                                                                  │
│  Client                  Backend                   better-auth  │
│    │                       │                           │        │
│    │ POST /sign-in/email   │                           │        │
│    │ {email, password}     │                           │        │
│    │──────────────────────►│                           │        │
│    │                       │                           │        │
│    │                       │ Verify password           │        │
│    │                       │ Check emailVerified       │        │
│    │                       │ Check isActive            │        │
│    │                       │ Check isLocked            │        │
│    │                       │ Create session with expiry │        │
│    │                       │                           │        │
│    │                       │ createSession ───────────►│        │
│    │                       │                           │        │
│    │                       │ Set-Cookie: session_token │        │
│    │                       │ Return JWT                │        │
│    │◄──────────────────────│                           │        │
│    │                       │                           │        │
│    │ GET /api/v1/auth/me   │                           │        │
│    │ (cookie auto-send)    │                           │        │
│    │──────────────────────►│                           │        │
│    │                       │ AuthGuard.verifySession() │        │
│    │                       │ getSession() ────────────►│        │
│    │                       │                           │        │
│    │                       │ Check session expiry      │        │
│    │                       │ Check isActive/isLocked   │        │
│    │                       │ Set request.user          │        │
│    │                       │                           │        │
│    │ { user: {..., role} } │                           │        │
│    │◄──────────────────────│                           │        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    JWT FLOW (Agent/Mobile)                       │
│                                                                  │
│  1. Sign in → get JWT from response                             │
│  2. Store JWT in localStorage                                   │
│  3. API call: Authorization: Bearer <JWT>                       │
│  4. AuthGuard.verifyJwt():                                      │
│     - Verify signature with JWKS                                │
│     - Check isActive/isLocked/emailVerified in DB               │
│     - Set request.user                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Payment Flow (Chi tiết)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                                  │
│                                                                  │
│  Employer              Backend                  Stripe          │
│    │                     │                        │              │
│    │ POST /checkout      │                        │              │
│    │ {jobId, packageId}  │                        │              │
│    │────────────────────►│                        │              │
│    │                     │                        │              │
│    │                     │ Validate:              │              │
│    │                     │ - Job exists & DRAFT   │              │
│    │                     │ - User owns company    │              │
│    │                     │ - Package active       │              │
│    │                     │ - No pending payment   │              │
│    │                     │                        │              │
│    │                     │ stripe.checkout        │              │
│    │                     │ .sessions.create ─────►│              │
│    │                     │                        │              │
│    │                     │ {url, sessionId}       │              │
│    │                     │◄───────────────────────│              │
│    │                     │                        │              │
│    │                     │ Create Payment (PENDING)│             │
│    │                     │                        │              │
│    │ {url: "https://..."}│                        │              │
│    │◄────────────────────│                        │              │
│    │                     │                        │              │
│    │ [Redirect to Stripe]│                        │              │
│    │─────────────────────────────────────────────►│              │
│    │                     │                        │              │
│    │ [User pays]         │                        │              │
│    │                     │                        │              │
│    │                     │  POST /webhook         │              │
│    │                     │  (checkout.session     │              │
│    │                     │   .completed)          │              │
│    │                     │◄───────────────────────│              │
│    │                     │                        │              │
│    │                     │ Verify signature       │              │
│    │                     │ Find Payment by        │              │
│    │                     │   gatewayRef           │              │
│    │                     │                        │              │
│    │                     │ Update Payment         │              │
│    │                     │   status=COMPLETED     │              │
│    │                     │                        │              │
│    │                     │ Update Job:            │              │
│    │                     │   status=ACTIVE        │              │
│    │                     │   deadline=today+days  │              │
│    │                     │                        │              │
│    │                     │ Inngest.send:          │              │
│    │                     │   job.activated        │              │
│    │                     │   audit/job.activated  │              │
│    │                     │                        │              │
│    │ [Redirect back]     │                        │              │
│    │◄─────────────────────────────────────────────│              │
│    │                     │                        │              │
│    │ GET /payment/success │                       │              │
│    │ ?session_id=...&jobId=...                    │              │
│    │────────────────────►│                        │              │
│    │                     │ mock-complete (dev)    │              │
│    │                     │ or webhook (prod)      │              │
│    │                     │                        │              │
│    │ "Thanh toán OK!"    │                        │              │
│    │◄────────────────────│                        │              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Application Status Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                APPLICATION STATUS MACHINE                        │
│                                                                  │
│                    ┌──────────┐                                  │
│                    │ PENDING  │ ◄── Initial state               │
│                    └────┬─────┘                                  │
│                         │                                        │
│            ┌────────────┼────────────┐                          │
│            │            │            │                          │
│            ▼            ▼            ▼                          │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│     │REVIEWING │ │ ACCEPTED │ │ REJECTED │                     │
│     └────┬─────┘ └──────────┘ └──────────┘                     │
│          │                                                      │
│     ┌────┴────┐                                                 │
│     │         │                                                 │
│     ▼         ▼                                                 │
│ ┌──────────┐ ┌──────────┐                                       │
│ │ ACCEPTED │ │ REJECTED │                                       │
│ └──────────┘ └──────────┘                                       │
│                                                                  │
│ Valid transitions:                                               │
│ - PENDING → REVIEWING, ACCEPTED, REJECTED                       │
│ - REVIEWING → ACCEPTED, REJECTED                                │
│ - ACCEPTED → (terminal)                                         │
│ - REJECTED → (terminal)                                         │
│                                                                  │
│ On ACCEPTED: Inngest event → notification to candidate          │
│ On REJECTED: Inngest event → notification to candidate          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Job Status Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOB STATUS MACHINE                            │
│                                                                  │
│  ┌──────────┐                                                   │
│  │  DRAFT   │ ◄── Created by employer                          │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ select package + checkout                               │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │ PENDING  │ ◄── Payment created, waiting for webhook         │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ payment webhook success                                 │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │  ACTIVE  │ ◄── Job visible to candidates                    │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ deadline reached                                        │
│       ▼                                                          │
│  ┌──────────┐      ┌──────────┐                                │
│  │ EXPIRED  │      │  CLOSED  │ ◄── employer close/archive     │
│  └──────────┘      └──────────┘                                │
│                                                                  │
│ Transitions:                                                     │
│ - DRAFT → PENDING (via checkout)                                │
│ - PENDING → ACTIVE (via payment webhook)                        │
│ - ACTIVE → EXPIRED (via deadline/Inngest)                       │
│ - ACTIVE → CLOSED (manual close/archive)                        │
│ - CLOSED/EXPIRED → terminal for public listing; republish must go through private checkout flow │
│ - archivedAt != null hides job from public/default workspace    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc dự án

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (27 tables, 12 enums)
│   ├── seed.ts                # Seed data (categories, templates, pricing)
│   └── migrations/
├── src/
│   ├── main.ts                # Bootstrap (CORS, guards, Inngest serve)
│   ├── app.module.ts          # Root module (imports all modules)
│   │
│   ├── auth/                  # Auth module (better-auth)
│   │   ├── auth.ts            # better-auth config (JWT, OTP, OAuth, hooks)
│   │   ├── auth.controller.ts # GET/PATCH /auth/me
│   │   ├── auth.service.ts    # getProfile, updateProfile
│   │   ├── guards/
│   │   │   ├── auth.guard.ts  # AuthGuard (JWT + Session + isActive check)
│   │   │   └── roles.guard.ts # RolesGuard (@Roles decorator)
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts    # @Public()
│   │   │   ├── roles.decorator.ts     # @Roles('ADMIN', 'EMPLOYER')
│   │   │   └── current-user.decorator.ts # @CurrentUser()
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── update-profile.dto.ts
│   │   └── templates/
│   │       ├── verify-otp.ts         # Email OTP template
│   │       └── reset-password-otp.ts # Reset password template
│   │
│   ├── common/                # Shared utilities
│   │   ├── cache/
│   │   │   ├── cache.module.ts    # @Global()
│   │   │   └── cache.service.ts   # Redis get/set/del/delPattern
│   │   ├── email/
│   │   │   ├── email.module.ts
│   │   │   └── email.service.ts   # Resend wrapper (dead code)
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts # Error format
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts # {data, timestamp}
│   │   └── types/
│   │       └── auth.types.ts      # AuthGuardUser type
│   │
│   ├── inngest/               # Event system
│   │   ├── client.ts          # Inngest client singleton
│   │   ├── events.types.ts    # 16 event type definitions
│   │   ├── inngest.module.ts  # @Global()
│   │   ├── inngest.service.ts # send() / sendBatch()
│   │   └── functions/
│   │       ├── notification.functions.ts  # 4 notification handlers
│   │       ├── user.functions.ts          # Welcome notification
│   │       ├── job-expiry.function.ts     # Schedule + auto-close
│   │       ├── audit.functions.ts         # Write audit logs
│   │       └── weekly-summary.function.ts # Cron summary
│   │
│   ├── prisma/                # Database
│   │   ├── prisma.module.ts   # @Global()
│   │   └── prisma.service.ts  # PrismaClient wrapper
│   │
│   └── modules/
│       ├── shared/
│       │   ├── shared.module.ts
│       │   └── contracts/
│       │       ├── job.contract.ts      # JobContractService
│       │       ├── company.contract.ts  # CompanyContractService
│       │       ├── pricing.contract.ts  # PricingContractService
│       │       └── payment.contract.ts  # PaymentContractService
│       │
│       ├── users/             # User management (ADMIN)
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       │
│       ├── companies/         # Company CRUD
│       │   ├── companies.module.ts
│       │   ├── companies.controller.ts
│       │   ├── companies.service.ts
│       │   └── dto/
│       │
│       ├── categories/        # Job categories
│       │   ├── categories.module.ts
│       │   ├── categories.controller.ts
│       │   ├── categories.service.ts
│       │   └── dto/
│       │
│       ├── address/           # Address (provinces/districts/wards)
│       │   ├── address.module.ts
│       │   ├── address.controller.ts
│       │   └── address.service.ts
│       │
│       ├── jobs/              # Job CRUD + status management
│       │   ├── jobs.module.ts
│       │   ├── jobs.controller.ts
│       │   ├── jobs.service.ts
│       │   └── dto/
│       │
│       ├── applications/      # Job applications
│       │   ├── applications.module.ts
│       │   ├── applications.controller.ts
│       │   ├── applications.service.ts
│       │   └── dto/
│       │
│       ├── resumes/           # CV management
│       │   ├── resumes.module.ts
│       │   ├── resumes.controller.ts
│       │   ├── resumes.service.ts
│       │   └── dto/
│       │
│       ├── notifications/     # Notifications
│       │   ├── notifications.module.ts
│       │   ├── notifications.controller.ts
│       │   ├── notifications.service.ts
│       │   └── dto/
│       │
│       ├── blogs/             # Blog posts
│       │   ├── blogs.module.ts
│       │   ├── blogs.controller.ts
│       │   ├── blogs.service.ts
│       │   └── dto/
│       │
│       ├── blog-categories/   # Blog categories
│       │   ├── blog-categories.module.ts
│       │   ├── blog-categories.controller.ts
│       │   ├── blog-categories.service.ts
│       │   └── dto/
│       │
│       ├── saved/             # Saved jobs/companies
│       │   ├── saved.module.ts
│       │   ├── saved.controller.ts
│       │   └── saved.service.ts
│       │
│       ├── pricing/           # Pricing packages
│       │   ├── pricing.module.ts
│       │   ├── pricing.controller.ts
│       │   ├── pricing.service.ts
│       │   └── dto/
│       │
│       ├── payments/          # Payments (Stripe + Mock)
│       │   ├── payments.module.ts
│       │   ├── payments.controller.ts
│       │   ├── payments.service.ts
│       │   ├── dto/
│       │   └── gateways/
│       │       ├── stripe.gateway.ts
│       │       └── mock.gateway.ts
│       │
│       └── audit/             # Audit logs
│           ├── audit.module.ts
│           ├── audit.controller.ts
│           ├── audit.service.ts
│           └── dto/
│
├── test/                      # Unit tests
├── vitest.config.ts
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Database Schema

### Enums (10)

| Enum | Values |
|------|--------|
| Role | CANDIDATE, EMPLOYER, ADMIN |
| CompanySize | SIZE_1_50, SIZE_51_200, SIZE_201_500, SIZE_500_PLUS |
| JobType | FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP, FREELANCE |
| ExperienceLevel | NO_EXPERIENCE, UNDER_1_YEAR, ONE_TO_THREE_YEARS, THREE_TO_FIVE_YEARS, OVER_FIVE_YEARS |
| JobLevel | INTERN, FRESHER, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR |
| JobStatus | DRAFT, PENDING, ACTIVE, CLOSED |
| ApplicationStatus | PENDING, REVIEWING, ACCEPTED, REJECTED |
| NotificationType | APPLICATION_RECEIVED, APPLICATION_ACCEPTED, APPLICATION_REJECTED, JOB_APPROVED, COMPANY_APPROVED, JOB_DEADLINE, SYSTEM |
| PaymentStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| BlogType | NORMAL, LANDING_PAGE |

### Tables (22)

**Auth (5):** user, account, session, verification, jwks

**Address (3):** AddressProvince, AddressDistrict, AddressWard

**Business (14):**
- JobCategory, Company, Job, JobApplication
- CandidateResume, ResumeTemplate
- Notification, SavedJob, SavedCompany
- BlogPost, BlogCategory
- PricingPackage, Payment, AuditLog

### Relations

```
user ──────┬── 1:N ──► Company (ownerId)
           ├── 1:N ──► JobApplication (userId)
           ├── 1:N ──► CandidateResume (userId)
           ├── 1:N ──► Notification (userId)
           ├── 1:N ──► SavedJob (userId)
           ├── 1:N ──► SavedCompany (userId)
           ├── 1:N ──► BlogPost (authorId)
           └── 1:N ──► Payment (userId)

Company ───┬── 1:N ──► Job (companyId)
           └── N:1 ──► AddressWard (wardId)

Job ───────┬── 1:N ──► JobApplication (jobId)
           ├── 1:N ──► SavedJob (jobId)
           ├── 1:N ──► Payment (jobId)
           ├── N:1 ──► JobCategory (categoryId)
           └── N:1 ──► AddressWard (wardId)

JobApplication ── N:1 ──► CandidateResume (resumeId)

CandidateResume ── N:1 ──► ResumeTemplate (templateId)

BlogPost ── N:1 ──► BlogCategory (categoryId)

Payment ── N:1 ──► PricingPackage (packageId)
```

---

## API Endpoints

### Response Format

**Success** (ResponseTransformInterceptor):
```json
{ "data": { ... }, "timestamp": "2026-06-06T10:30:00.000Z" }
```

**Paginated:**
```json
{
  "data": { "items": [...], "total": 100, "page": 1, "limit": 10, "totalPages": 10 },
  "timestamp": "..."
}
```

**Error** (GlobalExceptionFilter):
```json
{ "statusCode": 400, "message": "Error message", "error": "...?", "code": "...?", "details": { "...": "..." }, "timestamp": "...", "path": "/api/v1/jobs" }
```

---

### Auth (better-auth)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/auth/sign-up/email | PUBLIC | Đăng ký email/password (name, email, password, role bắt buộc) |
| POST | /api/auth/sign-in/email | PUBLIC | Đăng nhập → Set session cookie + JWT |
| POST | /api/auth/sign-out | SESSION | Đăng xuất |
| GET | /api/auth/token | SESSION | Lấy JWT token |
| GET | /api/auth/jwks | PUBLIC | Public keys (JWKS) |
| POST | /api/auth/email-otp/send-verification-otp | PUBLIC | Gửi OTP xác nhận email |
| POST | /api/auth/email-otp/verify-email | PUBLIC | Xác nhận OTP |
| POST | /api/auth/email-otp/request-password-reset | PUBLIC | Gửi OTP reset password |
| POST | /api/auth/email-otp/reset-password | PUBLIC | Đặt lại password (email, otp, password) |
| POST | /api/auth/sign-in/social/google | PUBLIC | Google OAuth |

### Custom Auth

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/auth/register-email | PUBLIC | Đăng ký email/password: user mới tạo tài khoản rồi xác nhận email, user OAuth cũ cùng email thì gửi OTP xác nhận |
| POST | /api/v1/auth/complete-email-registration | PUBLIC | Xác nhận OTP và hoàn tất credential account |
| POST | /api/v1/auth/request-password-reset | PUBLIC | Yêu cầu quên mật khẩu: tự phân luồng verify email / reset password / báo Google-only |
| GET | /api/v1/auth/me | AUTH | Lấy profile hiện tại |
| PATCH | /api/v1/auth/me | AUTH | Cập nhật profile (name, phone, image) |
| PATCH | /api/v1/auth/select-role | AUTH | Chọn role 1 lần cho user chưa có role |

### Scalar Auth (API Docs UI)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/scalar-auth/login | PUBLIC | Proxy login cho Scalar docs UI |
| POST | /api/v1/scalar-auth/register | PUBLIC | Proxy register cho Scalar docs UI (dùng cùng flow app) |
| POST | /api/v1/scalar-auth/logout | PUBLIC | Proxy logout cho Scalar docs UI |

### Users (ADMIN)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/users | ADMIN | Danh sách user (phân trang) |
| GET | /api/v1/users/:id | ADMIN | Chi tiết user |
| PATCH | /api/v1/users/:id | AUTH | Cập nhật (self or ADMIN) |
| PATCH | /api/v1/users/:id/toggle-active | ADMIN | Bật/tắt active |
| PATCH | /api/v1/users/:id/toggle-lock | ADMIN | Khóa/mở khóa |
| DELETE | /api/v1/users/:id | ADMIN | Xóa user |

### Companies

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/companies | PUBLIC | Danh sách công ty (?search, ?page, ?limit) |
| GET | /api/v1/companies/slug/:slug | PUBLIC | Chi tiết theo slug |
| GET | /api/v1/companies/my | EMPLOYER | Công ty của employer đang đăng nhập |
| GET | /api/v1/companies/:id | PUBLIC | Chi tiết theo ID |
| POST | /api/v1/companies | EMPLOYER | Tạo công ty (active ngay) |
| PATCH | /api/v1/companies/:id | OWNER | Cập nhật |
| DELETE | /api/v1/companies/:id | ADMIN | Xóa |

### Jobs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/jobs | PUBLIC | Public search. Bỏ qua `status` từ client, chỉ trả `ACTIVE`, chưa hết hạn, `archivedAt = null` |
| GET | /api/v1/jobs/slug/:slug | PUBLIC | Chi tiết theo slug, chỉ job đang public |
| GET | /api/v1/jobs/my | EMPLOYER | Jobs của employer. Mặc định ẩn archived; FE employer không expose chế độ xem archived |
| GET | /api/v1/jobs/my/stats | EMPLOYER | Thống kê jobs theo status/archive |
| GET | /api/v1/jobs/manage/:id | EMPLOYER | Detail nội bộ cho owner: sửa, checkout, clone, xem lịch sử |
| GET | /api/v1/jobs/:id | PUBLIC | Chi tiết theo ID, chỉ job đang public |
| POST | /api/v1/jobs | EMPLOYER | Tạo job DRAFT. Không nhận deadline; content lưu Markdown |
| PATCH | /api/v1/jobs/:id | OWNER | Cập nhật nội dung. Nếu job ACTIVE thì không reset payment/deadline/Inngest expiry |
| PATCH | /api/v1/jobs/:id/close | OWNER | Đóng tin sớm, public ẩn nhưng dashboard giữ lịch sử |
| DELETE | /api/v1/jobs/:id/employer | OWNER | Employer lưu trữ mềm job, không hard delete |
| PATCH | /api/v1/jobs/:id/restore | OWNER | Route kỹ thuật giữ lại, không expose trong FE employer v1 |
| DELETE | /api/v1/jobs/:id | ADMIN | Xóa |

### Applications

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/applications | CANDIDATE | Ứng tuyển (jobId, cvUrl, resumeId, coverLetter) |
| GET | /api/v1/applications/my | CANDIDATE | Đơn của tôi (?page, ?limit) |
| GET | /api/v1/applications/check/:jobId | CANDIDATE | Kiểm tra đã ứng tuyển job chưa |
| GET | /api/v1/applications/employer | EMPLOYER | Tất cả đơn cho jobs của employer |
| GET | /api/v1/applications/job/:jobId | EMPLOYER | Đơn theo job |
| GET | /api/v1/applications/:id/job | CANDIDATE/EMPLOYER | Xem lịch sử job theo application kể cả job đã closed/expired/archived |
| GET | /api/v1/applications/:id/messages | CANDIDATE/EMPLOYER | Xem chat thread application |
| POST | /api/v1/applications/:id/messages | CANDIDATE/EMPLOYER | Gửi chat, chỉ khi application ACCEPTED và chat chưa đóng |
| PATCH | /api/v1/applications/:id/messages/read | CANDIDATE/EMPLOYER | Mark read + refresh Redis presence |
| PATCH | /api/v1/applications/:id/chat/close | EMPLOYER | Đóng chat, giữ lịch sử |
| PATCH | /api/v1/applications/:id/status | EMPLOYER | Duyệt/từ chối (REVIEWING/ACCEPTED/REJECTED) |
| GET | /api/v1/applications/:id/resume | EMPLOYER | Lấy CV theo application ownership |
| GET | /api/v1/applications/:id/resume-file | EMPLOYER | Stream PDF upload inline qua backend proxy |
| PATCH | /api/v1/applications/:id/bookmark | EMPLOYER | Toggle bookmark |
| DELETE | /api/v1/applications/:id | CANDIDATE | Xoá khỏi workspace candidate, không hủy/rút đơn, không hard delete |
| DELETE | /api/v1/applications/:id/employer | EMPLOYER | Xoá khỏi workspace employer, không hard delete |

### Resumes

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/resumes/templates | PUBLIC | Danh sách templates CV |
| GET | /api/v1/resumes/templates/:id | PUBLIC | Chi tiết template |
| POST | /api/v1/resumes/templates | CANDIDATE | Tạo template CV |
| PATCH | /api/v1/resumes/templates/:id | CANDIDATE | Sửa template CV |
| DELETE | /api/v1/resumes/templates/:id | CANDIDATE | Xóa template CV |
| GET | /api/v1/resumes/my | CANDIDATE | CV của tôi |
| GET | /api/v1/resumes/:id | OWNER | Chi tiết CV (ownership check) |
| GET | /api/v1/resumes/:id/render | OWNER | Render CV HTML |
| POST | /api/v1/resumes/render-template | PUBLIC | Render template với sample data |
| — | FE route `/resumes/:id/print` | OWNER | Export CV bằng browser print; backend không còn endpoint PDF Puppeteer |
| POST | /api/v1/resumes | CANDIDATE | Tạo CV |
| PATCH | /api/v1/resumes/:id | OWNER | Cập nhật CV |
| DELETE | /api/v1/resumes/:id | OWNER | Xóa CV |

**Luồng lưu CV từ AI agent**

1. Agent/FE render draft CV bằng HTML/CSS ở frontend preview đã sanitize.
2. Nếu cần tạo template, agent chỉ gửi metadata `name`, `description?`, `previewUrl?`, `isPublic?` tới `POST /api/v1/resumes/templates`.
3. `ResumeTemplate` schema hiện không lưu `htmlTemplate/cssTemplate`; template record chỉ là metadata + owner/public state.
4. Prisma/DB sinh `ResumeTemplate.id`; agent chỉ được dùng id backend trả về.
5. Agent gọi `POST /api/v1/resumes` với `templateId` đó.
6. Export PDF dùng FE print route `/resumes/:id/print`; backend chỉ trả dữ liệu CV và kiểm quyền.

`templateId` là DB-generated. FE/agent không được tự tạo hoặc dùng id giả.

### Notifications

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/notifications | AUTH | Thông báo (?page, ?limit, ?isRead) |
| GET | /api/v1/notifications/unread-count | AUTH | Số chưa đọc |
| PATCH | /api/v1/notifications/:id/read | AUTH | Đánh dấu đã đọc |
| PATCH | /api/v1/notifications/read-all | AUTH | Đọc tất cả |

### Saved

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/saved/jobs/:jobId | CANDIDATE | Toggle lưu/bỏ lưu job |
| GET | /api/v1/saved/jobs | CANDIDATE | Jobs đã lưu (?page, ?limit) |
| POST | /api/v1/saved/companies/:companyId | CANDIDATE | Toggle lưu company |
| GET | /api/v1/saved/companies | CANDIDATE | Companies đã lưu |

### Address

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/address/tree | PUBLIC | Tỉnh/thành + quận/huyện + phường/xã |
| GET | /api/v1/address/wards | PUBLIC | Tất cả phường/xã |
| GET | /api/v1/address/wards/:id | PUBLIC | Địa chỉ đầy đủ |

### Categories

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/categories | PUBLIC | Danh mục nghề |
| GET | /api/v1/categories/:id | PUBLIC | Chi tiết |
| POST | /api/v1/categories | ADMIN | Tạo |
| PATCH | /api/v1/categories/:id | ADMIN | Sửa |
| DELETE | /api/v1/categories/:id | ADMIN | Xóa (Restrict nếu có jobs) |

### Blogs

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/blogs | PUBLIC | Danh sách (chỉ published) |
| GET | /api/v1/blogs/slug/:slug | PUBLIC | Chi tiết, không tự tăng view |
| POST | /api/v1/blogs/slug/:slug/view | PUBLIC | Tăng lượt xem sau khi FE xác nhận người dùng đã đọc |
| GET | /api/v1/blogs/my | CANDIDATE/EMPLOYER/ADMIN | Danh sách bài của tác giả hiện tại |
| POST | /api/v1/blogs | CANDIDATE/EMPLOYER/ADMIN | Tạo bài, content là Tiptap JSON |
| PATCH | /api/v1/blogs/:id | CANDIDATE/EMPLOYER/ADMIN | Sửa bài, chỉ tác giả hoặc ADMIN |
| DELETE | /api/v1/blogs/:id | CANDIDATE/EMPLOYER/ADMIN | Xóa bài, chỉ tác giả hoặc ADMIN |

### Blog Categories

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/blog-categories | PUBLIC | Danh mục blog |
| POST | /api/v1/blog-categories | ADMIN | Tạo |
| PATCH | /api/v1/blog-categories/:id | ADMIN | Sửa |
| DELETE | /api/v1/blog-categories/:id | ADMIN | Xóa |

### Pricing

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/pricing | PUBLIC | Danh sách gói (?active=true) |
| GET | /api/v1/pricing/:id | PUBLIC | Chi tiết gói |
| POST | /api/v1/pricing | ADMIN | Tạo gói mới |
| PATCH | /api/v1/pricing/:id | ADMIN | Sửa gói |
| DELETE | /api/v1/pricing/:id | ADMIN | Xóa gói |

### Payments (Stripe + Mock)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/payments/checkout | EMPLOYER | Tạo checkout session. Gateway là `stripe` nếu `STRIPE_SECRET_KEY` khả dụng, nếu không là `mock` |
| POST | /api/v1/payments/webhook | PUBLIC | Stripe webhook callback; mock webhook có thể dùng header `x-payment-gateway: mock` |
| POST | /api/v1/payments/mock-complete | EMPLOYER | Mock complete (dev only) |
| GET | /api/v1/payments/my | EMPLOYER | Lịch sử thanh toán |
| GET | /api/v1/payments/:id | EMPLOYER,ADMIN | Chi tiết payment |

### Quota

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/quota/me | AUTH | Snapshot gói hiện tại, hạn gói, usage/limit theo resource |
| GET | /api/v1/quota/packages | AUTH | Danh sách package quota active: Candidate Plus / Employer Pro theo 1/3/12 tháng |
| POST | /api/v1/quota/checkout | AUTH | Tạo quota checkout mock `{ packageId }` |
| POST | /api/v1/quota/mock-complete | AUTH | Hoàn tất quota checkout mock `{ sessionId }`, set plan expiry và emit `quota.plan.activated` |
| POST | /api/v1/quota/upgrade | AUTH | Legacy demo upgrade trực tiếp, giữ để tương thích |

Quota module hiện tại:

- `QuotaService` chỉ được tạo bởi NestJS DI, dùng cho request flow.
- `QuotaExpiryService` là helper riêng cho Inngest worker, đọc/ghi Prisma trực tiếp để downgrade/repair plan hết hạn.
- Quota lỗi dùng HTTP `403` với `code: QUOTA_EXCEEDED` và `details`/payload gồm `resource`, `used`, `limit`, `currentPlan`, `upgradePlan` nếu có.

### Audit (ADMIN)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/v1/audit | ADMIN | Nhật ký hệ thống (?action, ?entityType, ?entityId, ?actorId, ?page, ?limit) |
| GET | /api/v1/audit/:id | ADMIN | Chi tiết log |

### Inngest

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /api/inngest | PUBLIC | Health check |
| POST | /api/inngest | PUBLIC | Inngest serve endpoint (webhook) |

---

## Inngest Event System

### Events

| Event | Trigger | Handler |
|-------|---------|---------|
| application.created | Candidate nộp CV | Notification cho employer |
| application.accepted | Employer chấp nhận | Notification cho candidate |
| application.rejected | Employer từ chối | Notification cho candidate |
| user.registered | User đăng ký | Welcome notification |
| job.activated | Payment thành công | Notification + schedule expiry |
| job.expiring-soon | 3 ngày trước deadline | Notify users đã lưu job |
| job.expired | Đến deadline | Đóng job + notify owner |
| quota.plan.activated | Mock quota purchase hoàn tất | Schedule quota downgrade theo `expiresAt` |
| weekly-employer-summary | Cron Thu+Sat 9AM | Tổng hợp CV cho employer |

### Functions (13)

| Function ID | Trigger | Hành động |
|-------------|---------|-----------|
| on-user-registered | user.registered | Welcome notification |
| on-job-activated | job.activated | JOB_APPROVED notification |
| on-application-created | application.created | APPLICATION_RECEIVED notification |
| on-application-accepted | application.accepted | APPLICATION_ACCEPTED notification |
| on-application-rejected | application.rejected | APPLICATION_REJECTED notification |
| schedule-job-expiry | job.activated | Schedule job.expiring-soon + job.expired |
| on-job-expiring-soon | job.expiring-soon | Notify saved-job users |
| on-job-expired | job.expired | Close job + notify owner |
| close-expired-active-jobs | Cron repair | Quét job ACTIVE quá deadline và đóng lại nếu event deadline bị miss |
| quota-plan-expiry | quota.plan.activated | Đợi tới expiry rồi downgrade nếu plan vẫn còn đúng hạn đó |
| repair-expired-quota-plans | Cron repair | Downgrade quota đã hết hạn nếu event bị miss |
| cleanup-notifications | Cron 0 3 * * * | Xoá notification hết hạn hoặc đã đọc quá 90 ngày |
| weekly-employer-summary | Cron 0 9 * * 4,6 | Summary notifications |

### Job Edit vs Inngest Expiry

- Employer sửa job ACTIVE qua `PATCH /api/v1/jobs/:id` chỉ cập nhật content fields trong DB, invalidate Redis cache và sync embedding nếu job vẫn public-visible.
- API update job luôn bỏ qua `deadline`; deadline chỉ sinh từ checkout duration khi payment complete.
- Edit job không emit lại `job.activated`, không tạo payment mới, không clone job và không restart Inngest expiry.
- Event `job.expired` đã schedule từ lúc thanh toán vẫn dùng `jobId` để đọc lại DB. Function chỉ đóng job nếu job vẫn `ACTIVE` và deadline trong event còn khớp deadline hiện tại.
- `close-expired-active-jobs` là cron repair chung, không thuộc riêng job nào; nó chỉ đóng các job ACTIVE đã quá deadline nếu còn sót.

### Inngest Serve Source of Truth

- Runtime endpoint hiện dùng `main.ts` mount `serve()` tại `/api/inngest`.
- `InngestModule` chỉ export `InngestService`; không đăng ký controller serve riêng để tránh hai handler cùng phục vụ event.
- Controller Inngest cũ đã xoá; không thêm lại handler thứ hai trong module.
- Khi deploy, cấu hình Inngest trỏ về `POST /api/inngest`.

---

## Caching Strategy

| Data | TTL | Cache Key Pattern |
|------|-----|-------------------|
| Company list/detail/slug | 5 min | companies:list:{page}:{limit}:{search} |
| Job list/detail/slug | 5 min | jobs:list:{params...} |
| Categories | 1 hour | categories:all |
| Blog categories | 1 hour | blog_categories:all |
| Address data | 24 hours | address:provinces, address:districts:{provinceId} |
| Pricing packages | 1 hour | pricing:all:{active} |

**Invalidation:** Write operations call `delPattern('{module}:*')`.

---

## Cài đặt

### Yêu cầu

- Node.js >= 20
- PostgreSQL >= 15
- Redis >= 7
- pnpm >= 9

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | ✅ | — | PostgreSQL connection string |
| BETTER_AUTH_SECRET | ✅ | — | Secret key (32+ chars) |
| BETTER_AUTH_URL | ✅ | — | Backend URL |
| REDIS_URL | ✅ | — | Redis connection string |
| FRONTEND_URL | ✅ | — | Frontend URL for CORS |
| PORT | ❌ | 3000 | Server port |
| NODE_ENV | ❌ | development | Environment |
| RESEND_API_KEY | ❌ | — | Resend email API key |
| EMAIL_FROM | ❌ | onboarding@resend.dev | Sender email |
| GOOGLE_CLIENT_ID | ❌ | — | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | ❌ | — | Google OAuth client secret |
| GOOGLE_CALLBACK_URL | ❌ | `${FRONTEND_URL}/api/auth/callback/google` | Google OAuth redirect URI qua Next.js BFF |
| STRIPE_SECRET_KEY | ❌ | — | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | ❌ | — | Stripe webhook secret |
| INNGEST_EVENT_KEY | ❌ | — | Inngest event key |
| INNGEST_SIGNING_KEY | ❌ | — | Inngest signing key |
| CLOUDINARY_CLOUD_NAME | ❌ | — | Cloudinary cloud name, bắt buộc khi dùng upload logo công ty hoặc CV PDF upload |
| CLOUDINARY_API_KEY | ❌ | — | Cloudinary API key, bắt buộc khi dùng upload logo công ty hoặc CV PDF upload |
| CLOUDINARY_API_SECRET | ❌ | — | Cloudinary API secret, bắt buộc khi dùng upload logo công ty hoặc CV PDF upload |

### Cloudinary Uploads

- Logo công ty được crop trên FE rồi upload qua `POST /api/v1/upload/company-logo`.
- DB lưu URL hiển thị ở `Company.logo` và Cloudinary public id ở `Company.logoPublicId`.
- Khi employer đổi logo, backend upload ảnh mới, cập nhật DB thành công rồi mới xoá logo cũ bằng `logoPublicId`.
- Ảnh bìa công ty được crop 1600x500 trên FE rồi upload qua `POST /api/v1/upload/company-cover`; DB lưu `Company.coverImage` và `Company.coverImagePublicId`.
- Avatar candidate được crop vuông trên FE rồi upload qua `POST /api/v1/upload/candidate-avatar`; backend sync `user.image/user.imagePublicId` và profile resume `CandidateResume.avatar/avatarPublicId`.
- CV PDF ứng tuyển được upload qua `POST /api/v1/upload/candidate-cv`, form-data field `file`, chỉ nhận PDF tối đa 10MB.
- CV PDF được lưu trên Cloudinary `image/upload` trong folder `job-phuquoc/candidate-cvs/{userId}`; employer xem qua `GET /api/v1/applications/:id/resume-file`, không mở URL Cloudinary trực tiếp.
- Nếu gặp CV cũ ở `image/upload` bị Cloudinary chặn public delivery, backend tạo signed download URL nội bộ rồi stream PDF inline.

### Setup

```bash
# Install dependencies
pnpm install

# Run migrations
cd backend
npx prisma migrate dev

# Seed data
npx prisma db seed

# Development
pnpm dev

# Production
pnpm build
pnpm start:prod
```

### Test

```bash
# Unit tests
pnpm test

# Type check
npx tsc --noEmit
```

---

## Design Patterns

| Pattern | Where | Description |
|---------|-------|-------------|
| Repository | PrismaService | Data access layer |
| Service Layer | *.service.ts | Business logic |
| DTO | dto/*.dto.ts | Input validation (class-validator) |
| Guard | guards/*.guard.ts | AuthGuard + RolesGuard |
| Decorator | decorators/*.decorator.ts | @CurrentUser, @Public, @Roles |
| Interceptor | ResponseTransformInterceptor | Wrap response {data, timestamp} |
| Filter | GlobalExceptionFilter | Consistent error format |
| Contract | shared/contracts/*.contract.ts | Cross-module queries |
| Gateway | payments/gateways/*.gateway.ts | Stripe + Mock gateway |
| Event-Driven | Inngest functions | Async cross-module communication |
| Cache-Aside | CacheService | Redis caching + manual invalidation |
| State Machine | Job/Application status | Validated transitions |

## Realtime Socket.IO

- Backend dùng `RealtimeModule` với Socket.IO namespace `/realtime`; chưa tách microservice riêng.
- Socket auth dùng session cookie `better-auth.session_token`, cùng nguồn xác thực với REST.
- Rooms chính:
  - `user:{userId}` cho notification và dashboard invalidate.
  - `application:{applicationId}` cho chat theo đơn ứng tuyển.
  - `employer:{userId}` / `candidate:{userId}` cho mở rộng theo role.
- REST vẫn là source of truth. Socket chỉ emit sau khi DB ghi thành công.
- Redis adapter dùng `REDIS_URL` để scale nhiều backend instance; nếu Redis lỗi ở local, gateway vẫn chạy single instance và log warning.
- Inngest vẫn xử lý workflow nền; helper tạo notification sẽ emit Socket.IO event sau khi upsert notification.
- Event server emit:
  - `application.message.created`
  - `application.messages.read`
  - `notification.created`
  - `notification.read`
  - `notification.all_read`
  - `notification.unread_count.changed`
  - `dashboard.invalidate`
