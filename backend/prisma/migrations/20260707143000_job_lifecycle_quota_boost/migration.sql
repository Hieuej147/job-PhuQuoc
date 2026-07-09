-- Job lifecycle/payment metadata for small-production retention rules.
-- Business data is retained; jobs/applications are hidden or transitioned by status.

DO $$ BEGIN
  CREATE TYPE "JobCloseReason" AS ENUM ('EXPIRED', 'EMPLOYER_CLOSED', 'ADMIN_CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "job"
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closeReason" "JobCloseReason",
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "boostLevel" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activationId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentPaymentId" TEXT;

ALTER TABLE "payment"
  ADD COLUMN IF NOT EXISTS "listingAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "boostAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "boostLevel" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "activationId" TEXT;

ALTER TABLE "job_application"
  ADD COLUMN IF NOT EXISTS "employerMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "job_status_deadline_idx" ON "job"("status", "deadline");
CREATE INDEX IF NOT EXISTS "job_featuredUntil_boostLevel_idx" ON "job"("featuredUntil", "boostLevel");
