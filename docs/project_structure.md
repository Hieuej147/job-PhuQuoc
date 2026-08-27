# Cấu trúc dự án PQJobs (WebPhuQuoc)

Dự án này là một nền tảng tìm kiếm việc làm thông minh tại Phú Quốc, được thiết kế theo mô hình Modular Monolith ở Backend, sử dụng Next.js cho Frontend, tích hợp hệ thống AI Agent sử dụng LangGraph (Python) để hỗ trợ cả Nhà tuyển dụng (Recruiter) và Ứng viên (Candidate).

## Tổng quan các thư mục chính

1. **`backend/`**: Hệ thống API Server viết bằng NestJS (TypeScript).
   - [schema.prisma](file:///f:/WebPhuQuoc/job-PhuQuoc/backend/prisma/schema.prisma): Quản lý cơ sở dữ liệu qua Prisma ORM.
   - `src/modules/`: Chứa các module chức năng độc lập (ví dụ: `jobs`, `applications`, `resumes`, `payments`, `chat-threads`...).
   - `src/inngest/`: Hệ thống xử lý các tác vụ nền (background tasks) dựa trên sự kiện.
2. **`web/`**: Ứng dụng Frontend Next.js kết hợp cùng AI Agent Server (Python).
   - [web/src](file:///f:/WebPhuQuoc/job-PhuQuoc/web/src): Mã nguồn Next.js (App Router, components, features...).
   - [web/agent](file:///f:/WebPhuQuoc/job-PhuQuoc/web/agent): Mã nguồn hệ thống AI Agent (Python) xây dựng trên LangGraph.
3. **`deploy/`**: Chứa cấu hình Nginx phục vụ chạy local/deploy thực tế.
4. **`docker/`**: Chứa file cấu hình Docker Compose để khởi chạy cơ sở dữ liệu Postgres, Redis.
5. **`docs/`**: Chứa toàn bộ tài liệu đặc tả dự án, kiến trúc AI Agent và thiết kế hệ thống.
6. **`scripts/`**: Chứa các script backup, restore và seed database.

---

## Sơ đồ cấu trúc thư mục đầy đủ (100%)

Dưới đây là sơ đồ chi tiết toàn bộ các file và thư mục trong dự án PQJobs (đã loại bỏ `node_modules`, `.next`, `.git`, `.turbo` và các file build/cache tự sinh):

```text
job-PhuQuoc/
|-- backend
|   |-- prisma
|   |   |-- migrations
|   |   |   |-- 20260527172752_init
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260528134559_add_pricing_payments_audit
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260530_remove_rejected_and_isapproved
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260531175700_rename_entities
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260606120319_sync_schema
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260629143000_add_company_logo_public_id
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260630101000_add_candidate_resume_contact_snapshot
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260630103500_remove_resume_template_html_css
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260703013000_notification_retention_dashboard
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260707070000_add_candidate_resume_is_profile
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260707080000_add_user_avatar_public_id
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260707143000_job_lifecycle_quota_boost
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260707160000_application_messages
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260708100000_user_quota_plan
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260708113000_application_chat_archive
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260708143000_quota_expiry_application_workspace_delete
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260709170000_job_archive_fields
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260710110000_blog_content_json
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260710143000_company_cover_image
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260715120000_add_ai_chat_threads
|   |   |   |   `-- migration.sql
|   |   |   |-- 20260721150000_add_email_integration
|   |   |   |   `-- migration.sql
|   |   |   `-- migration_lock.toml
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- scripts
|   |   |-- add-test-saved-jobs.ts
|   |   |-- check-user-profile.ts
|   |   |-- normalize-job-markdown.ts
|   |   |-- register-test-users.sh
|   |   |-- sync-embeddings.ts
|   |   `-- verify-ngoan.ts
|   |-- src
|   |   |-- auth
|   |   |   |-- decorators
|   |   |   |   |-- current-user.decorator.ts
|   |   |   |   |-- public.decorator.ts
|   |   |   |   `-- roles.decorator.ts
|   |   |   |-- dto
|   |   |   |   |-- complete-email-registration.dto.ts
|   |   |   |   |-- login.dto.ts
|   |   |   |   |-- register-email.dto.ts
|   |   |   |   |-- request-password-reset.dto.ts
|   |   |   |   |-- select-role.dto.ts
|   |   |   |   `-- update-profile.dto.ts
|   |   |   |-- guards
|   |   |   |   |-- auth.guard.ts
|   |   |   |   `-- roles.guard.ts
|   |   |   |-- templates
|   |   |   |   |-- reset-password-otp.ts
|   |   |   |   `-- verify-otp.ts
|   |   |   |-- auth.controller.ts
|   |   |   |-- auth.module.ts
|   |   |   |-- auth.service.ts
|   |   |   |-- auth.ts
|   |   |   `-- scalar-auth.controller.ts
|   |   |-- common
|   |   |   |-- cache
|   |   |   |   |-- cache.module.ts
|   |   |   |   |-- cache.service.ts
|   |   |   |   `-- index.ts
|   |   |   |-- dto
|   |   |   |   `-- response.dto.ts
|   |   |   |-- email
|   |   |   |   `-- resend.client.ts
|   |   |   |-- filters
|   |   |   |   `-- global-exception.filter.ts
|   |   |   |-- interceptors
|   |   |   |   `-- response-transform.interceptor.ts
|   |   |   |-- logger
|   |   |   |   |-- logger.module.ts
|   |   |   |   `-- pino-logger.service.ts
|   |   |   |-- quota
|   |   |   |   |-- quota-expiry.service.ts
|   |   |   |   |-- quota-policy.ts
|   |   |   |   |-- quota.constants.ts
|   |   |   |   |-- quota.controller.ts
|   |   |   |   |-- quota.module.ts
|   |   |   |   |-- quota.service.ts
|   |   |   |   `-- quota.types.ts
|   |   |   `-- types
|   |   |       |-- auth.types.ts
|   |   |       |-- index.ts
|   |   |       `-- response.types.ts
|   |   |-- inngest
|   |   |   |-- functions
|   |   |   |   |-- job-expiry.function.ts
|   |   |   |   |-- notification-cleanup.function.ts
|   |   |   |   |-- notification-inbox.helper.ts
|   |   |   |   |-- notification.functions.ts
|   |   |   |   |-- quota-plan-expiry.function.ts
|   |   |   |   |-- user.functions.ts
|   |   |   |   `-- weekly-summary.function.ts
|   |   |   |-- client.ts
|   |   |   |-- events.types.ts
|   |   |   |-- inngest.module.ts
|   |   |   |-- inngest.service.ts
|   |   |   `-- inngest.types.ts
|   |   |-- modules
|   |   |   |-- address
|   |   |   |   |-- address.controller.ts
|   |   |   |   |-- address.module.ts
|   |   |   |   `-- address.service.ts
|   |   |   |-- applications
|   |   |   |   |-- dto
|   |   |   |   |   |-- application-query.dto.ts
|   |   |   |   |   `-- application.dto.ts
|   |   |   |   |-- infrastructure
|   |   |   |   |   `-- application-events.publisher.ts
|   |   |   |   |-- applications.controller.ts
|   |   |   |   |-- applications.module.ts
|   |   |   |   `-- applications.service.ts
|   |   |   |-- audit
|   |   |   |   |-- dto
|   |   |   |   |   `-- query-audit.dto.ts
|   |   |   |   |-- audit.controller.ts
|   |   |   |   |-- audit.module.ts
|   |   |   |   `-- audit.service.ts
|   |   |   |-- blog-categories
|   |   |   |   |-- dto
|   |   |   |   |   `-- blog-category.dto.ts
|   |   |   |   |-- blog-categories.controller.ts
|   |   |   |   |-- blog-categories.module.ts
|   |   |   |   `-- blog-categories.service.ts
|   |   |   |-- blogs
|   |   |   |   |-- dto
|   |   |   |   |   `-- blog.dto.ts
|   |   |   |   |-- blogs.controller.ts
|   |   |   |   |-- blogs.module.ts
|   |   |   |   `-- blogs.service.ts
|   |   |   |-- categories
|   |   |   |   |-- dto
|   |   |   |   |   `-- category.dto.ts
|   |   |   |   |-- categories.controller.ts
|   |   |   |   |-- categories.module.ts
|   |   |   |   `-- categories.service.ts
|   |   |   |-- chat-threads
|   |   |   |   |-- dto
|   |   |   |   |   `-- chat-thread.dto.ts
|   |   |   |   |-- chat-threads.controller.ts
|   |   |   |   |-- chat-threads.module.ts
|   |   |   |   `-- chat-threads.service.ts
|   |   |   |-- companies
|   |   |   |   |-- dto
|   |   |   |   |   `-- company.dto.ts
|   |   |   |   |-- companies.controller.ts
|   |   |   |   |-- companies.module.ts
|   |   |   |   `-- companies.service.ts
|   |   |   |-- dashboard
|   |   |   |   |-- dashboard.controller.ts
|   |   |   |   |-- dashboard.module.ts
|   |   |   |   `-- dashboard.service.ts
|   |   |   |-- email-integration
|   |   |   |   |-- dto
|   |   |   |   |   `-- send-email.dto.ts
|   |   |   |   |-- email-integration.controller.ts
|   |   |   |   |-- email-integration.module.ts
|   |   |   |   `-- email-integration.service.ts
|   |   |   |-- jobs
|   |   |   |   |-- background
|   |   |   |   |   `-- job-background.service.ts
|   |   |   |   |-- dto
|   |   |   |   |   `-- job.dto.ts
|   |   |   |   |-- services
|   |   |   |   |   `-- embedding.service.ts
|   |   |   |   |-- jobs.controller.ts
|   |   |   |   |-- jobs.module.ts
|   |   |   |   `-- jobs.service.ts
|   |   |   |-- notifications
|   |   |   |   |-- dto
|   |   |   |   |   `-- notification.dto.ts
|   |   |   |   |-- notifications.controller.ts
|   |   |   |   |-- notifications.module.ts
|   |   |   |   `-- notifications.service.ts
|   |   |   |-- payments
|   |   |   |   |-- application
|   |   |   |   |   `-- payment-completion.service.ts
|   |   |   |   |-- dto
|   |   |   |   |   |-- create-checkout.dto.ts
|   |   |   |   |   `-- payment.dto.ts
|   |   |   |   |-- gateways
|   |   |   |   |   |-- mock.gateway.ts
|   |   |   |   |   `-- stripe.gateway.ts
|   |   |   |   |-- payments.controller.ts
|   |   |   |   |-- payments.module.ts
|   |   |   |   `-- payments.service.ts
|   |   |   |-- pricing
|   |   |   |   |-- dto
|   |   |   |   |   |-- create-pricing.dto.ts
|   |   |   |   |   `-- update-pricing.dto.ts
|   |   |   |   |-- pricing.controller.ts
|   |   |   |   |-- pricing.module.ts
|   |   |   |   `-- pricing.service.ts
|   |   |   |-- resumes
|   |   |   |   |-- dto
|   |   |   |   |   `-- resume.dto.ts
|   |   |   |   |-- resumes.controller.ts
|   |   |   |   |-- resumes.module.ts
|   |   |   |   `-- resumes.service.ts
|   |   |   |-- saved
|   |   |   |   |-- dto
|   |   |   |   |   `-- saved-query.dto.ts
|   |   |   |   |-- saved.controller.ts
|   |   |   |   |-- saved.module.ts
|   |   |   |   `-- saved.service.ts
|   |   |   |-- shared
|   |   |   |   |-- contracts
|   |   |   |   |   |-- audit.contract.ts
|   |   |   |   |   |-- company.contract.ts
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- job.contract.ts
|   |   |   |   |   |-- payment.contract.ts
|   |   |   |   |   |-- pricing.contract.ts
|   |   |   |   |   `-- user.contract.ts
|   |   |   |   `-- shared.module.ts
|   |   |   |-- upload
|   |   |   |   |-- cloudinary.service.ts
|   |   |   |   |-- upload.controller.ts
|   |   |   |   |-- upload.module.ts
|   |   |   |   `-- upload.service.ts
|   |   |   `-- users
|   |   |       |-- dto
|   |   |       |   `-- user.dto.ts
|   |   |       |-- users.controller.ts
|   |   |       |-- users.module.ts
|   |   |       `-- users.service.ts
|   |   |-- prisma
|   |   |   |-- prisma-client.factory.ts
|   |   |   |-- prisma.module.ts
|   |   |   `-- prisma.service.ts
|   |   |-- realtime
|   |   |   |-- realtime-socket.service.ts
|   |   |   |-- realtime-sse.service.ts
|   |   |   |-- realtime.controller.ts
|   |   |   |-- realtime.gateway.ts
|   |   |   |-- realtime.module.ts
|   |   |   |-- realtime.service.ts
|   |   |   |-- realtime.types.ts
|   |   |   `-- socket-auth.service.ts
|   |   |-- app.module.ts
|   |   `-- main.ts
|   |-- test
|   |   |-- address.service.spec.ts
|   |   |-- applications.service.spec.ts
|   |   |-- audit.service.spec.ts
|   |   |-- auth-guard.e2e.spec.ts
|   |   |-- auth.controller.spec.ts
|   |   |-- auth.guard.spec.ts
|   |   |-- auth.service.spec.ts
|   |   |-- blog-categories.service.spec.ts
|   |   |-- blogs.service.spec.ts
|   |   |-- categories.service.spec.ts
|   |   |-- chat-threads.service.spec.ts
|   |   |-- companies.service.spec.ts
|   |   |-- dashboard.service.spec.ts
|   |   |-- jobs.service.spec.ts
|   |   |-- notifications.service.spec.ts
|   |   |-- payment-completion.service.spec.ts
|   |   |-- pricing.service.spec.ts
|   |   |-- quota-expiry.service.spec.ts
|   |   |-- resumes.service.spec.ts
|   |   |-- roles.guard.spec.ts
|   |   |-- saved.service.spec.ts
|   |   |-- upload.controller.spec.ts
|   |   |-- upload.service.spec.ts
|   |   `-- users.service.spec.ts
|   |-- .env
|   |-- README.md
|   |-- nest-cli.json
|   |-- package.json
|   |-- prisma.config.ts
|   |-- query.ts
|   |-- query_db.js
|   |-- test-db.js
|   |-- tsconfig.json
|   `-- vitest.config.ts
|-- deploy
|   `-- nginx
|   |   |-- pqjobs-backend.local.conf
|   |   `-- pqjobs-local-main.conf
|-- docker
|   |-- .env.example
|   `-- docker-compose.yml
|-- docs
|   |-- BAO_CAO_THUC_TAP_AI_AGENT.md
|   |-- FE_FOLDER_STRUCTURE_GUIDE.md
|   |-- MODULAR_MONOLITH_GUIDE.md
|   |-- NoteHuynhhThanh.md
|   |-- PROJECT_DOCS.md
|   |-- REVERSE_PROXY_NGINX_DEPLOYMENT.md
|   |-- agent_architecture_detailed.md
|   |-- khai_niem_agent.md
|   |-- scalar-api-guide.md
|   |-- sodo.md
|   `-- sodo_tools.md
|-- logs
|   |-- .gitkeep
|   |-- inngest-error.log
|   `-- inngest-out.log
|-- scripts
|   |-- backup-db.sh
|   |-- run-inngest-dev.js
|   `-- seed-from-backup.ts
|-- web
|   |-- agent
|   |   |-- .langgraph_api
|   |   |   |-- .langgraph_checkpoint.1.pckl
|   |   |   |-- .langgraph_checkpoint.2.pckl
|   |   |   |-- .langgraph_checkpoint.3.pckl
|   |   |   |-- .langgraph_ops.pckl
|   |   |   |-- .langgraph_retry_counter.pckl
|   |   |   |-- store.pckl
|   |   |   `-- store.vectors.pckl
|   |   |-- agents
|   |   |   |-- __init__.py
|   |   |   |-- base_agent.py
|   |   |   |-- candidate_agent.py
|   |   |   |-- custom_agent.py
|   |   |   `-- recruiter_agent.py
|   |   |-- core
|   |   |   |-- __init__.py
|   |   |   |-- agent_factory.py
|   |   |   |-- api_client.py
|   |   |   |-- checkpointer.py
|   |   |   |-- config.py
|   |   |   |-- context.py
|   |   |   `-- prompts.py
|   |   |-- schemas
|   |   |   |-- __init__.py
|   |   |   |-- candidate.py
|   |   |   `-- recruiter.py
|   |   |-- src
|   |   |-- tools
|   |   |   |-- candidate
|   |   |   |   |-- __init__.py
|   |   |   |   |-- career_advisor.py
|   |   |   |   |-- choose_cv_template.py
|   |   |   |   |-- cv_template.py
|   |   |   |   |-- get_cv_detail.py
|   |   |   |   |-- list_my_cvs.py
|   |   |   |   |-- resume_helpers.py
|   |   |   |   |-- save_cv.py
|   |   |   |   `-- search_jobs.py
|   |   |   |-- recruiter
|   |   |   |   |-- __init__.py
|   |   |   |   |-- create_job.py
|   |   |   |   |-- draft_email.py
|   |   |   |   |-- get_candidates.py
|   |   |   |   |-- get_categories.py
|   |   |   |   |-- get_work_locations.py
|   |   |   |   |-- rank_candidates.py
|   |   |   |   `-- update_application_status.py
|   |   |   |-- shared
|   |   |   |   |-- __init__.py
|   |   |   |   `-- create_blog_post.py
|   |   |   |-- __init__.py
|   |   |   |-- base_tool.py
|   |   |   `-- helpers.py
|   |   |-- .gitignore
|   |   |-- .python-version
|   |   |-- graphs.py
|   |   |-- langgraph.json
|   |   |-- main.py
|   |   |-- pyproject.toml
|   |   |-- sync_embeddings.py
|   |   `-- uv.lock
|   |-- docker
|   |   |-- Dockerfile.agent
|   |   `-- Dockerfile.app
|   |-- fixtures
|   |   `-- default.json
|   |-- public
|   |   |-- templates
|   |   |   |-- preview-classic.svg
|   |   |   |-- preview-creative.svg
|   |   |   |-- preview-dev.svg
|   |   |   |-- preview-fallback.svg
|   |   |   |-- preview-minimal.svg
|   |   |   `-- preview-modern.svg
|   |   |-- copilotkit-logo-mark.svg
|   |   |-- copilotkit-logo.svg
|   |   |-- file.svg
|   |   |-- globe.svg
|   |   |-- next.svg
|   |   |-- vercel.svg
|   |   `-- window.svg
|   |-- scripts
|   |   |-- run-agent.bat
|   |   |-- run-agent.js
|   |   |-- run-agent.sh
|   |   |-- setup-agent.bat
|   |   `-- setup-agent.sh
|   |-- src
|   |   |-- app
|   |   |   |-- (main)
|   |   |   |   |-- about
|   |   |   |   |   |-- AboutPageClient.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- blog
|   |   |   |   |   |-- [slug]
|   |   |   |   |   |   |-- loading.tsx
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |-- loading.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- companies
|   |   |   |   |   |-- [slug]
|   |   |   |   |   |   |-- CompanyDetailClient.tsx
|   |   |   |   |   |   |-- loading.tsx
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |-- layout.tsx
|   |   |   |   |   |-- loading.tsx
|   |   |   |   |   |-- metadata.ts
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- contact
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- jobs
|   |   |   |   |   |-- [slug]
|   |   |   |   |   |   |-- JobDetailClient.tsx
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |-- JobsPageClient.tsx
|   |   |   |   |   |-- layout.tsx
|   |   |   |   |   |-- loading.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- payment
|   |   |   |   |   `-- success
|   |   |   |   |       `-- page.tsx
|   |   |   |   |-- HomePageClient.tsx
|   |   |   |   |-- layout.tsx
|   |   |   |   |-- loading.tsx
|   |   |   |   `-- page.tsx
|   |   |   |-- api
|   |   |   |   |-- agent
|   |   |   |   |   `-- [...slug]
|   |   |   |   |       `-- route.ts
|   |   |   |   `-- copilotkit
|   |   |   |       `-- [[...slug]]
|   |   |   |           `-- route.ts
|   |   |   |-- applications
|   |   |   |   `-- [id]
|   |   |   |       `-- resume
|   |   |   |           `-- print
|   |   |   |               `-- page.tsx
|   |   |   |-- auth
|   |   |   |   |-- callback
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- forgot-password
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- login
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- register
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- reset-password
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- select-role
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- verify-otp
|   |   |   |       `-- page.tsx
|   |   |   |-- blog
|   |   |   |   |-- [slug]
|   |   |   |   |   `-- edit
|   |   |   |   |       `-- page.tsx
|   |   |   |   `-- new
|   |   |   |       `-- page.tsx
|   |   |   |-- candidate
|   |   |   |   |-- ai-cv
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- applications
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- blogs
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- dashboard
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- notifications
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- profile
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- resumes
|   |   |   |   |   |-- [id]
|   |   |   |   |   |   |-- edit
|   |   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |   |-- print
|   |   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |-- new
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |-- template
|   |   |   |   |   |   `-- [slug]
|   |   |   |   |   |       `-- page.tsx
|   |   |   |   |   |-- templates
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- saved
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- saved-companies
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- settings
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- layout.tsx
|   |   |   |-- employer
|   |   |   |   |-- applications
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- blogs
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- company
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- dashboard
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- jobs
|   |   |   |   |   |-- [id]
|   |   |   |   |   |   |-- checkout
|   |   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   |   `-- edit
|   |   |   |   |   |       `-- page.tsx
|   |   |   |   |   |-- create
|   |   |   |   |   |   `-- page.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- notifications
|   |   |   |   |   `-- page.tsx
|   |   |   |   |-- settings
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- layout.tsx
|   |   |   |-- quota
|   |   |   |   `-- checkout
|   |   |   |       `-- page.tsx
|   |   |   |-- resumes
|   |   |   |   `-- [id]
|   |   |   |       `-- print
|   |   |   |           `-- page.tsx
|   |   |   |-- styles
|   |   |   |   |-- animations.css
|   |   |   |   |-- base.css
|   |   |   |   |-- content.css
|   |   |   |   `-- tokens.css
|   |   |   |-- favicon.ico
|   |   |   |-- globals.css
|   |   |   |-- layout.tsx
|   |   |   |-- not-found.tsx
|   |   |   |-- providers.tsx
|   |   |   |-- robots.ts
|   |   |   `-- sitemap.ts
|   |   |-- components
|   |   |   |-- Forms
|   |   |   |   |-- AdditionalInfoForm.tsx
|   |   |   |   |-- CertificationsForm.tsx
|   |   |   |   |-- ContactInfoForm.tsx
|   |   |   |   |-- EducationForm.tsx
|   |   |   |   |-- ProfileInfoForm.tsx
|   |   |   |   |-- ProjectsForm.tsx
|   |   |   |   |-- SkillsForm.tsx
|   |   |   |   `-- WorkExperienceForm.tsx
|   |   |   |-- ai
|   |   |   |   |-- renderers
|   |   |   |   |   |-- blog-tools-renderer.tsx
|   |   |   |   |   |-- cv-tools-renderer.tsx
|   |   |   |   |   |-- job-list-card.tsx
|   |   |   |   |   |-- job-search-renderer.tsx
|   |   |   |   |   `-- job-tools-renderer.tsx
|   |   |   |   |-- agent-progress-chat-message.tsx
|   |   |   |   |-- agent-progress-panel.tsx
|   |   |   |   |-- dashboard-ai-tab.tsx
|   |   |   |   `-- global-ai-chat-widget.tsx
|   |   |   |-- applications
|   |   |   |   |-- application-chat-dialog.tsx
|   |   |   |   `-- application-chat-parts.tsx
|   |   |   |-- auth
|   |   |   |   |-- auth-layout.tsx
|   |   |   |   |-- auth-provider.tsx
|   |   |   |   `-- google-button.tsx
|   |   |   |-- blog
|   |   |   |   |-- BlogCard.tsx
|   |   |   |   |-- BlogContentRender.tsx
|   |   |   |   |-- BlogDetailClient.tsx
|   |   |   |   |-- BlogEditor.tsx
|   |   |   |   |-- BlogFilterBar.tsx
|   |   |   |   |-- BlogHero.tsx
|   |   |   |   |-- BlogList.tsx
|   |   |   |   |-- BlogManagement.tsx
|   |   |   |   |-- BlogPageClient.tsx
|   |   |   |   |-- BlogViewTracker.tsx
|   |   |   |   |-- LandingPageIframe.tsx
|   |   |   |   `-- PostMetadataForm.tsx
|   |   |   |-- candidate
|   |   |   |   `-- profile
|   |   |   |       |-- Avatar.tsx
|   |   |   |       |-- BasicInfo.tsx
|   |   |   |       |-- CheckList.tsx
|   |   |   |       |-- Education.tsx
|   |   |   |       |-- Experience.tsx
|   |   |   |       |-- Socials.tsx
|   |   |   |       `-- Summary.tsx
|   |   |   |-- common
|   |   |   |   |-- BlogCard.tsx
|   |   |   |   |-- Footer.tsx
|   |   |   |   |-- Header.tsx
|   |   |   |   |-- HeaderGate.tsx
|   |   |   |   |-- JobCard.tsx
|   |   |   |   `-- SearchBar.tsx
|   |   |   |-- company
|   |   |   |   |-- CompaniesFilterBar.tsx
|   |   |   |   |-- CompaniesHero.tsx
|   |   |   |   |-- CompaniesPageClient.tsx
|   |   |   |   |-- CompanyCard.tsx
|   |   |   |   |-- CompanyList.tsx
|   |   |   |   `-- company-logo.tsx
|   |   |   |-- cv
|   |   |   |   `-- template-renderer.tsx
|   |   |   |-- dashboard
|   |   |   |   |-- recent-applications.tsx
|   |   |   |   |-- recent-list.tsx
|   |   |   |   |-- stats-card.tsx
|   |   |   |   `-- stats-cards.tsx
|   |   |   |-- home
|   |   |   |   |-- HomeBlogs.tsx
|   |   |   |   |-- HomeCategories.tsx
|   |   |   |   |-- HomeFeaturedJobs.tsx
|   |   |   |   |-- HomeHero.tsx
|   |   |   |   `-- HomeWhyChoose.tsx
|   |   |   |-- jobs
|   |   |   |   |-- DeadlineCard.tsx
|   |   |   |   |-- JobCard.tsx
|   |   |   |   |-- JobContent.tsx
|   |   |   |   |-- JobDetailHero.tsx
|   |   |   |   |-- JobDetailSidebar.tsx
|   |   |   |   |-- JobFilter.tsx
|   |   |   |   |-- JobList.tsx
|   |   |   |   |-- JobSortBar.tsx
|   |   |   |   |-- JobStickyBarMobile.tsx
|   |   |   |   |-- JobsHero.tsx
|   |   |   |   `-- RelatedJobs.tsx
|   |   |   |-- layout
|   |   |   |   |-- candidate-sidebar.tsx
|   |   |   |   `-- employer-sidebar.tsx
|   |   |   |-- media
|   |   |   |   |-- image-crop-dialog.tsx
|   |   |   |   `-- image-crop.ts
|   |   |   |-- quota
|   |   |   |   |-- quota-upgrade-dialog.tsx
|   |   |   |   `-- quota-usage-card.tsx
|   |   |   |-- resume
|   |   |   |   `-- resume-print-document.tsx
|   |   |   |-- ui
|   |   |   |   |-- MarkdownRichEditor.tsx
|   |   |   |   |-- RichTextEditor.tsx
|   |   |   |   |-- avatar.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- button.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- chart.tsx
|   |   |   |   |-- checkbox.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- dropdown-menu.tsx
|   |   |   |   |-- empty-state.tsx
|   |   |   |   |-- input.tsx
|   |   |   |   |-- label.tsx
|   |   |   |   |-- popover.tsx
|   |   |   |   |-- rich-content.tsx
|   |   |   |   |-- select.tsx
|   |   |   |   |-- separator.tsx
|   |   |   |   |-- sheet.tsx
|   |   |   |   |-- sidebar.tsx
|   |   |   |   |-- skeleton.tsx
|   |   |   |   |-- sonner.tsx
|   |   |   |   |-- spinner.tsx
|   |   |   |   |-- switch.tsx
|   |   |   |   |-- table.tsx
|   |   |   |   |-- tabs.tsx
|   |   |   |   |-- textarea.tsx
|   |   |   |   `-- tooltip.tsx
|   |   |   `-- theme-provider.tsx
|   |   |-- features
|   |   |   |-- ai-chat
|   |   |   |   |-- api.ts
|   |   |   |   |-- constants.ts
|   |   |   |   |-- message-content.ts
|   |   |   |   |-- thread-history-renderer.tsx
|   |   |   |   |-- thread-sidebar.tsx
|   |   |   |   |-- use-ai-chat-thread-session.ts
|   |   |   |   |-- use-ai-thread-activity.ts
|   |   |   |   `-- use-chat-threads.ts
|   |   |   |-- applications
|   |   |   |   `-- hooks
|   |   |   |       `-- use-application-chat.ts
|   |   |   |-- auth-register
|   |   |   |   |-- components
|   |   |   |   |   `-- register-card.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   `-- use-register-form.ts
|   |   |   |   |-- api.ts
|   |   |   |   `-- types.ts
|   |   |   |-- blog
|   |   |   |   |-- api.ts
|   |   |   |   |-- types.ts
|   |   |   |   |-- upload-post-image.ts
|   |   |   |   `-- use-blog-editor-form.ts
|   |   |   |-- blog-detail
|   |   |   |   `-- api.ts
|   |   |   |-- blog-management
|   |   |   |   `-- api.ts
|   |   |   |-- candidate-profile
|   |   |   |   |-- api.ts
|   |   |   |   |-- form-helpers.ts
|   |   |   |   |-- types.ts
|   |   |   |   `-- use-candidate-profile-form.ts
|   |   |   |-- dashboard
|   |   |   |   `-- queries.ts
|   |   |   |-- employer-applications
|   |   |   |   |-- components
|   |   |   |   |   |-- applicant-card.tsx
|   |   |   |   |   |-- application-cv-dialog.tsx
|   |   |   |   |   |-- application-status-dialog.tsx
|   |   |   |   |   |-- applications-summary-cards.tsx
|   |   |   |   |   `-- applications-toolbar.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   `-- use-employer-applications.ts
|   |   |   |   |-- types.ts
|   |   |   |   `-- utils.ts
|   |   |   |-- employer-company
|   |   |   |   |-- components
|   |   |   |   |   |-- company-basic-form.tsx
|   |   |   |   |   |-- company-completion-card.tsx
|   |   |   |   |   |-- company-page-header.tsx
|   |   |   |   |   `-- company-preview-sidebar.tsx
|   |   |   |   |-- api.ts
|   |   |   |   |-- types.ts
|   |   |   |   `-- utils.ts
|   |   |   |-- employer-dashboard
|   |   |   |   |-- components
|   |   |   |   |   |-- dashboard-header.tsx
|   |   |   |   |   |-- dashboard-stat-cards.tsx
|   |   |   |   |   |-- hiring-summary-card.tsx
|   |   |   |   |   |-- notifications-panel.tsx
|   |   |   |   |   |-- quick-actions-card.tsx
|   |   |   |   |   |-- recent-applicants-panel.tsx
|   |   |   |   |   `-- recent-jobs-table.tsx
|   |   |   |   |-- types.ts
|   |   |   |   `-- utils.tsx
|   |   |   |-- employer-email
|   |   |   |   `-- api.ts
|   |   |   |-- employer-jobs
|   |   |   |   |-- components
|   |   |   |   |   |-- checkout-sections.tsx
|   |   |   |   |   `-- job-form.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   |-- use-employer-jobs.ts
|   |   |   |   |   `-- use-job-checkout.ts
|   |   |   |   |-- api.ts
|   |   |   |   |-- constants.ts
|   |   |   |   |-- types.ts
|   |   |   |   `-- utils.ts
|   |   |   |-- job-detail
|   |   |   |   |-- api.ts
|   |   |   |   |-- job-apply-modal.tsx
|   |   |   |   `-- use-job-apply-flow.ts
|   |   |   |-- jobs-search
|   |   |   |   `-- api.ts
|   |   |   |-- locations
|   |   |   |   `-- api.ts
|   |   |   |-- notifications
|   |   |   |   |-- queries.ts
|   |   |   |   `-- utils.ts
|   |   |   |-- realtime
|   |   |   |   |-- config.ts
|   |   |   |   |-- realtime-provider.tsx
|   |   |   |   `-- use-application-chat-realtime.ts
|   |   |   |-- saved-companies
|   |   |   |   `-- api.ts
|   |   |   |-- saved-jobs
|   |   |   |   `-- api.ts
|   |   |   `-- seo
|   |   |       `-- structured-data.ts
|   |   |-- hooks
|   |   |   |-- use-mobile.ts
|   |   |   |-- use-resume-editor.ts
|   |   |   |-- use-template-renderer.tsx
|   |   |   |-- use-theme.tsx
|   |   |   `-- useScrollAnimation.ts
|   |   |-- lib
|   |   |   |-- utils
|   |   |   |   |-- date.ts
|   |   |   |   `-- format.ts
|   |   |   |-- api-client.ts
|   |   |   |-- auth-client.ts
|   |   |   |-- auth.ts
|   |   |   |-- html-safety.ts
|   |   |   |-- profile-completion.ts
|   |   |   |-- resume-pdf.ts
|   |   |   |-- resume-template-data.ts
|   |   |   |-- server-auth.ts
|   |   |   `-- utils.ts
|   |   |-- template
|   |   |   |-- TemplateClassic.tsx
|   |   |   |-- TemplateCreative.tsx
|   |   |   |-- TemplateElegant.tsx
|   |   |   |-- TemplateFuturistic.tsx
|   |   |   |-- TemplateMinimalistModern.tsx
|   |   |   |-- TemplateModern.tsx
|   |   |   `-- index.ts
|   |   |-- types
|   |   |   |-- blog.ts
|   |   |   |-- company.ts
|   |   |   |-- job.ts
|   |   |   `-- resume.ts
|   |   `-- proxy.ts
|   |-- .dockerignore
|   |-- .env
|   |-- .gitignore
|   |-- CLAUDE.md
|   |-- Dockerfile
|   |-- LICENSE
|   |-- README.md
|   |-- components.json
|   |-- docker-compose.test.yml
|   |-- docker-route-override.ts
|   |-- entrypoint.sh
|   |-- next-env.d.ts
|   |-- next.config.ts
|   |-- package.json
|   |-- pnpm-workspace.yaml
|   |-- postcss.config.mjs
|   |-- serve.py
|   |-- showcase.json
|   `-- tsconfig.json
|-- .gitignore
|-- TEAM_FE_DOCUMENT.md
|-- ecosystem.config.js
|-- package.json
`-- pnpm-workspace.yaml
