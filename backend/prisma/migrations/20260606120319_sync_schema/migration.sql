/*
  Warnings:

  - You are about to drop the `AddressDistrict` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AddressProvince` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AddressWard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlogCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlogPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CandidateResume` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PricingPackage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResumeTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BlogType" AS ENUM ('NORMAL', 'LANDING_PAGE');

-- DropForeignKey
ALTER TABLE "AddressDistrict" DROP CONSTRAINT "AddressDistrict_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "AddressWard" DROP CONSTRAINT "AddressWard_districtId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CandidateResume" DROP CONSTRAINT "CandidateResume_templateId_fkey";

-- DropForeignKey
ALTER TABLE "CandidateResume" DROP CONSTRAINT "CandidateResume_userId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_wardId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_wardId_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedCompany" DROP CONSTRAINT "SavedCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "SavedCompany" DROP CONSTRAINT "SavedCompany_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedJob" DROP CONSTRAINT "SavedJob_jobId_fkey";

-- DropForeignKey
ALTER TABLE "SavedJob" DROP CONSTRAINT "SavedJob_userId_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- DropTable
DROP TABLE "AddressDistrict";

-- DropTable
DROP TABLE "AddressProvince";

-- DropTable
DROP TABLE "AddressWard";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "BlogCategory";

-- DropTable
DROP TABLE "BlogPost";

-- DropTable
DROP TABLE "CandidateResume";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "JobApplication";

-- DropTable
DROP TABLE "JobCategory";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "PricingPackage";

-- DropTable
DROP TABLE "ResumeTemplate";

-- DropTable
DROP TABLE "SavedCompany";

-- DropTable
DROP TABLE "SavedJob";

-- CreateTable
CREATE TABLE "address_province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "address_province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_district" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,

    CONSTRAINT "address_district_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_ward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "address_ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "description" TEXT,
    "wardId" TEXT,
    "addressDetail" TEXT,
    "size" "CompanySize",
    "industry" TEXT,
    "ownerId" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" TEXT,
    "requirements" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "wardId" TEXT,
    "addressDetail" TEXT,
    "type" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "experience" "ExperienceLevel",
    "level" "JobLevel",
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cvUrl" TEXT,
    "resumeId" TEXT,
    "coverLetter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Hồ sơ của tôi',
    "address" TEXT,
    "summary" TEXT,
    "socialLinks" JSONB,
    "education" JSONB,
    "experience" JSONB,
    "projects" JSONB,
    "skills" TEXT,
    "degree" TEXT,
    "languages" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "previewUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "refId" TEXT,
    "refType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "BlogType" NOT NULL DEFAULT 'NORMAL',
    "content" TEXT,
    "landingContent" JSONB,
    "thumbnail" TEXT,
    "excerpt" TEXT,
    "categoryId" TEXT,
    "authorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT NOT NULL DEFAULT 'mock',
    "gatewayRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "actorId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "address_province_slug_key" ON "address_province"("slug");

-- CreateIndex
CREATE INDEX "address_district_provinceId_idx" ON "address_district"("provinceId");

-- CreateIndex
CREATE INDEX "address_ward_districtId_idx" ON "address_ward"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "job_category_name_key" ON "job_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_category_slug_key" ON "job_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_slug_key" ON "company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_ownerId_key" ON "company"("ownerId");

-- CreateIndex
CREATE INDEX "company_ownerId_idx" ON "company"("ownerId");

-- CreateIndex
CREATE INDEX "company_wardId_idx" ON "company"("wardId");

-- CreateIndex
CREATE UNIQUE INDEX "job_slug_key" ON "job"("slug");

-- CreateIndex
CREATE INDEX "job_categoryId_idx" ON "job"("categoryId");

-- CreateIndex
CREATE INDEX "job_companyId_idx" ON "job"("companyId");

-- CreateIndex
CREATE INDEX "job_status_idx" ON "job"("status");

-- CreateIndex
CREATE INDEX "job_wardId_idx" ON "job"("wardId");

-- CreateIndex
CREATE INDEX "job_application_userId_idx" ON "job_application"("userId");

-- CreateIndex
CREATE INDEX "job_application_jobId_idx" ON "job_application"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_application_userId_jobId_key" ON "job_application"("userId", "jobId");

-- CreateIndex
CREATE INDEX "candidate_resume_userId_idx" ON "candidate_resume"("userId");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_refType_refId_idx" ON "notification"("refType", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_job_userId_jobId_key" ON "saved_job"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_company_userId_companyId_key" ON "saved_company"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_authorId_idx" ON "blog_post"("authorId");

-- CreateIndex
CREATE INDEX "blog_post_categoryId_idx" ON "blog_post"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_slug_key" ON "blog_category"("slug");

-- CreateIndex
CREATE INDEX "payment_userId_idx" ON "payment"("userId");

-- CreateIndex
CREATE INDEX "payment_jobId_idx" ON "payment"("jobId");

-- CreateIndex
CREATE INDEX "payment_gatewayRef_idx" ON "payment"("gatewayRef");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- AddForeignKey
ALTER TABLE "address_district" ADD CONSTRAINT "address_district_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "address_province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_ward" ADD CONSTRAINT "address_ward_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "address_district"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "address_ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "address_ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "job_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "candidate_resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_resume" ADD CONSTRAINT "candidate_resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_resume" ADD CONSTRAINT "candidate_resume_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "resume_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_job" ADD CONSTRAINT "saved_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_job" ADD CONSTRAINT "saved_job_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_company" ADD CONSTRAINT "saved_company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_company" ADD CONSTRAINT "saved_company_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "pricing_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
