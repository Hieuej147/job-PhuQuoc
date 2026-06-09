# Phú Quốc Jobs — Backend API

Backend API cho website tìm việc làm tại Phú Quốc, xây dựng với NestJS theo kiến trúc Modular Monolith.

## Công nghệ

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | NestJS | 11 |
| Language | TypeScript | 5.7 |
| ORM | Prisma | 6 |
| Database | PostgreSQL | 16 |
| Cache/Session | Redis (ioredis) | 5.4 |
| Auth | better-auth | 1.5 |
| Email | Resend | 6.12 |
| Async Events | Inngest | 4.4 |
| Payment | Stripe | 22.2 |
| API Docs | Scalar + Swagger | — |
| Testing | Vitest + Supertest | 3.0 |

---

## Kiến trúc tổng quan

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
│  │  │ PDF Gen  │ │ Publish  │ │ Cascade  │ │ Jobs     │      │   │
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
│  │ 23 tables│ │ TTL 5min │ │ 10 funcs │ │ Webhook  │ │ Verify   ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                                     │
│  ┌──────────┐ ┌──────────┐                                        │
│  │  Google  │ │ Puppeteer│                                        │
│  │  OAuth   │ │ PDF Gen  │                                        │
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
│    │   ├── Session cookie? → better-auth getSession + check    │
│    │   └── None? → 401 Unauthorized                            │
│    │                                                            │
│    └── RolesGuard                                               │
│        ├── Get user.role from request.user                      │
│        ├── @Roles() specified? → check role in list            │
│        ├── No @Roles()? → allow any authenticated user         │
│        └── role null? → default to CANDIDATE                   │
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
│    ├── Business logic validation                                │
│    ├── Cache check (CacheService)                               │
│    ├── Prisma queries                                           │
│    ├── Cache write (if applicable)                              │
│    ├── Inngest events (async side effects)                      │
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
│                    REGISTRATION FLOW                             │
│                                                                  │
│  Client                  Backend                   better-auth  │
│    │                       │                           │        │
│    │ POST /sign-up/email   │                           │        │
│    │ {name,email,pass,role}│                           │        │
│    │──────────────────────►│                           │        │
│    │                       │                           │        │
│    │                       │ before hook:              │        │
│    │                       │ - Validate role           │        │
│    │                       │ - Set role in user data   │        │
│    │                       │                           │        │
│    │                       │ createUser() ────────────►│        │
│    │                       │                           │        │
│    │                       │ after hook:               │        │
│    │                       │ - Check if OAuth user     │        │
│    │                       │ - If email user: keep role│        │
│    │                       │ - If OAuth: set role=null │        │
│    │                       │ - Send Inngest event      │        │
│    │                       │                           │        │
│    │                       │ linkAccount (credential)  │        │
│    │                       │──────────────────────────►│        │
│    │                       │                           │        │
│    │                       │ createSession             │        │
│    │                       │──────────────────────────►│        │
│    │                       │                           │        │
│    │                       │ Set-Cookie: session_token │        │
│    │◄──────────────────────│                           │        │
│    │                       │                           │        │
│    │ POST /email-otp/send  │                           │        │
│    │──────────────────────►│                           │        │
│    │                       │ Send OTP via Resend       │        │
│    │◄──────────────────────│                           │        │
│    │                       │                           │        │
│    │ [User enters OTP]     │                           │        │
│    │                       │                           │        │
│    │ POST /email-otp/verify│                           │        │
│    │──────────────────────►│                           │        │
│    │                       │ Verify OTP                │        │
│    │                       │ Set emailVerified=true    │        │
│    │◄──────────────────────│                           │        │
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
│     - Check isActive/isLocked in DB                             │
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
│  ┌──────────┐                                                   │
│  │  CLOSED  │ ◄── Job no longer accepting applications         │
│  └──────────┘                                                   │
│                                                                  │
│ Transitions:                                                     │
│ - DRAFT → PENDING (via checkout)                                │
│ - PENDING → ACTIVE (via payment webhook)                        │
│ - ACTIVE → CLOSED (via deadline or manual)                      │
│ - CLOSED → (terminal)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc dự án

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (22 tables, 10 enums)
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
│   │   ├── inngest.controller.ts # POST /inngest webhook
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
{ "statusCode": 400, "message": "Error message", "timestamp": "...", "path": "/api/v1/jobs" }
```

---

### Auth (better-auth)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/auth/sign-up/email | PUBLIC | Đăng ký (name, email, password, role) |
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
| GET | /api/v1/auth/me | AUTH | Lấy profile hiện tại |
| PATCH | /api/v1/auth/me | AUTH | Cập nhật profile (name, phone, role) |
| GET | /api/v1/auth/admin-only | ADMIN | Test endpoint cho admin |

### Scalar Auth (API Docs UI)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/scalar-auth/login | PUBLIC | Proxy login cho Scalar docs UI |
| POST | /api/v1/scalar-auth/register | PUBLIC | Proxy register cho Scalar docs UI |
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
| GET | /api/v1/jobs | PUBLIC | Tìm kiếm (?search, ?categoryId, ?type, ?experience, ?level, ?salaryMin, ?salaryMax, ?wardId, ?status, ?page, ?limit). Mặc định: ACTIVE |
| GET | /api/v1/jobs/slug/:slug | PUBLIC | Chi tiết theo slug |
| GET | /api/v1/jobs/my | EMPLOYER | Jobs của employer (tất cả status) |
| GET | /api/v1/jobs/:id | PUBLIC | Chi tiết |
| POST | /api/v1/jobs | EMPLOYER | Tạo job (status: DRAFT) |
| PATCH | /api/v1/jobs/:id | OWNER | Cập nhật |
| DELETE | /api/v1/jobs/:id | ADMIN | Xóa |

### Applications

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/applications | CANDIDATE | Ứng tuyển (jobId, cvUrl, resumeId, coverLetter) |
| GET | /api/v1/applications/my | CANDIDATE | Đơn của tôi (?page, ?limit) |
| GET | /api/v1/applications/employer | EMPLOYER | Tất cả đơn cho jobs của employer |
| GET | /api/v1/applications/job/:jobId | EMPLOYER | Đơn theo job |
| PATCH | /api/v1/applications/:id/status | EMPLOYER | Duyệt/từ chối (REVIEWING/ACCEPTED/REJECTED) |
| PATCH | /api/v1/applications/:id/bookmark | EMPLOYER | Toggle bookmark |
| DELETE | /api/v1/applications/:id | CANDIDATE | Rút đơn |

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
| GET | /api/v1/resumes/:id/pdf | OWNER | Export CV PDF (Puppeteer) |
| POST | /api/v1/resumes | CANDIDATE | Tạo CV |
| PATCH | /api/v1/resumes/:id | OWNER | Cập nhật CV |
| DELETE | /api/v1/resumes/:id | OWNER | Xóa CV |

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
| GET | /api/v1/address/provinces | PUBLIC | Tỉnh/thành |
| GET | /api/v1/address/provinces/:id/districts | PUBLIC | Quận/huyện |
| GET | /api/v1/address/districts/:id/wards | PUBLIC | Phường/xã |
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
| GET | /api/v1/blogs/slug/:slug | PUBLIC | Chi tiết |
| POST | /api/v1/blogs | ADMIN | Tạo bài |
| PATCH | /api/v1/blogs/:id | ADMIN | Sửa bài |
| DELETE | /api/v1/blogs/:id | ADMIN | Xóa |

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

### Payments (Stripe)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /api/v1/payments/checkout | EMPLOYER | Tạo Stripe checkout session |
| POST | /api/v1/payments/webhook | PUBLIC | Stripe webhook callback |
| POST | /api/v1/payments/mock-complete | EMPLOYER | Mock complete (dev only) |
| GET | /api/v1/payments/my | EMPLOYER | Lịch sử thanh toán |
| GET | /api/v1/payments/:id | EMPLOYER,ADMIN | Chi tiết payment |

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

### Events (16 loại)

| Event | Trigger | Handler |
|-------|---------|---------|
| application.created | Candidate nộp CV | Notification cho employer |
| application.accepted | Employer chấp nhận | Notification cho candidate |
| application.rejected | Employer từ chối | Notification cho candidate |
| user.registered | User đăng ký | Welcome notification |
| job.activated | Payment thành công | Notification + schedule expiry |
| job.expiring-soon | 3 ngày trước deadline | Notify users đã lưu job |
| job.expired | Đến deadline | Đóng job + notify owner |
| audit/* (wildcard) | Mọi mutation | Ghi AuditLog vào DB |
| weekly-employer-summary | Cron Thu+Sat 9AM | Tổng hợp CV cho employer |

### Functions (10)

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
| write-audit-log | audit/* | Write AuditLog row |
| weekly-employer-summary | Cron 0 9 * * 4,6 | Summary notifications |

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
| STRIPE_SECRET_KEY | ❌ | — | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | ❌ | — | Stripe webhook secret |
| INNGEST_EVENT_KEY | ❌ | — | Inngest event key |
| INNGEST_SIGNING_KEY | ❌ | — | Inngest signing key |

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
