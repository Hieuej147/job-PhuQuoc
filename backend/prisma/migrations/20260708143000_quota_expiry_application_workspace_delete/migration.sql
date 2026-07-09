-- Application workspace deletes
ALTER TABLE "job_application"
  ADD COLUMN IF NOT EXISTS "candidateDeletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "employerDeletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "job_application_userId_candidateDeletedAt_idx"
  ON "job_application"("userId", "candidateDeletedAt");

CREATE INDEX IF NOT EXISTS "job_application_jobId_employerDeletedAt_idx"
  ON "job_application"("jobId", "employerDeletedAt");

-- Quota plan expiry
ALTER TABLE "user_quota_plan"
  ADD COLUMN IF NOT EXISTS "candidatePlanExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "employerPlanExpiresAt" TIMESTAMP(3);

-- Quota packages
CREATE TABLE IF NOT EXISTS "quota_package" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetPlan" TEXT NOT NULL,
  "durationMonths" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quota_package_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "quota_package_targetPlan_idx"
  ON "quota_package"("targetPlan");

CREATE INDEX IF NOT EXISTS "quota_package_isActive_idx"
  ON "quota_package"("isActive");

-- Quota purchases
CREATE TABLE IF NOT EXISTS "quota_purchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "targetPlan" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "durationMonths" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "gateway" TEXT NOT NULL DEFAULT 'mock',
  "gatewayRef" TEXT,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "quota_purchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quota_purchase_gatewayRef_key"
  ON "quota_purchase"("gatewayRef");

CREATE INDEX IF NOT EXISTS "quota_purchase_userId_idx"
  ON "quota_purchase"("userId");

CREATE INDEX IF NOT EXISTS "quota_purchase_packageId_idx"
  ON "quota_purchase"("packageId");

CREATE INDEX IF NOT EXISTS "quota_purchase_status_idx"
  ON "quota_purchase"("status");

CREATE INDEX IF NOT EXISTS "quota_purchase_expiresAt_idx"
  ON "quota_purchase"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quota_purchase_userId_fkey'
  ) THEN
    ALTER TABLE "quota_purchase"
      ADD CONSTRAINT "quota_purchase_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quota_purchase_packageId_fkey'
  ) THEN
    ALTER TABLE "quota_purchase"
      ADD CONSTRAINT "quota_purchase_packageId_fkey"
      FOREIGN KEY ("packageId") REFERENCES "quota_package"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "quota_package" ("id", "name", "targetPlan", "durationMonths", "price", "isActive")
VALUES
  ('candidate-plus-1m', 'Candidate Plus - 1 tháng', 'CANDIDATE_PLUS', 1, 49000, true),
  ('candidate-plus-3m', 'Candidate Plus - 3 tháng', 'CANDIDATE_PLUS', 3, 129000, true),
  ('candidate-plus-12m', 'Candidate Plus - 12 tháng', 'CANDIDATE_PLUS', 12, 399000, true),
  ('employer-pro-1m', 'Employer Pro - 1 tháng', 'EMPLOYER_PRO', 1, 199000, true),
  ('employer-pro-3m', 'Employer Pro - 3 tháng', 'EMPLOYER_PRO', 3, 499000, true),
  ('employer-pro-12m', 'Employer Pro - 12 tháng', 'EMPLOYER_PRO', 12, 1599000, true)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "targetPlan" = EXCLUDED."targetPlan",
  "durationMonths" = EXCLUDED."durationMonths",
  "price" = EXCLUDED."price",
  "isActive" = EXCLUDED."isActive";
