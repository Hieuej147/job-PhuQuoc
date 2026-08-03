-- Reporting system shared by PQJobs and the separate adminjob application.
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FRAUD', 'FAKE_INFO', 'INAPPROPRIATE', 'SCAM', 'OTHER');

CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED');

CREATE TABLE "job_report" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_report" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_report" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blog_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_report" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_report_jobId_idx" ON "job_report"("jobId");
CREATE INDEX "job_report_reporterId_idx" ON "job_report"("reporterId");
CREATE INDEX "job_report_status_idx" ON "job_report"("status");
CREATE INDEX "company_report_companyId_idx" ON "company_report"("companyId");
CREATE INDEX "company_report_reporterId_idx" ON "company_report"("reporterId");
CREATE INDEX "company_report_status_idx" ON "company_report"("status");
CREATE INDEX "blog_report_blogId_idx" ON "blog_report"("blogId");
CREATE INDEX "blog_report_reporterId_idx" ON "blog_report"("reporterId");
CREATE INDEX "blog_report_status_idx" ON "blog_report"("status");
CREATE INDEX "user_report_targetId_idx" ON "user_report"("targetId");
CREATE INDEX "user_report_reporterId_idx" ON "user_report"("reporterId");
CREATE INDEX "user_report_status_idx" ON "user_report"("status");

ALTER TABLE "job_report" ADD CONSTRAINT "job_report_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_report" ADD CONSTRAINT "job_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_report" ADD CONSTRAINT "company_report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_report" ADD CONSTRAINT "company_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blog_report" ADD CONSTRAINT "blog_report_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blog_report" ADD CONSTRAINT "blog_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_report" ADD CONSTRAINT "user_report_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_report" ADD CONSTRAINT "user_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
