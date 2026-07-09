CREATE TYPE "CandidateQuotaPlan" AS ENUM ('CANDIDATE_FREE', 'CANDIDATE_PLUS');
CREATE TYPE "EmployerQuotaPlan" AS ENUM ('EMPLOYER_BASIC', 'EMPLOYER_PRO');

CREATE TABLE "user_quota_plan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "candidatePlan" "CandidateQuotaPlan" NOT NULL DEFAULT 'CANDIDATE_FREE',
  "employerPlan" "EmployerQuotaPlan" NOT NULL DEFAULT 'EMPLOYER_BASIC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_quota_plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_quota_plan_userId_key" ON "user_quota_plan"("userId");
CREATE INDEX "user_quota_plan_candidatePlan_idx" ON "user_quota_plan"("candidatePlan");
CREATE INDEX "user_quota_plan_employerPlan_idx" ON "user_quota_plan"("employerPlan");

ALTER TABLE "user_quota_plan"
  ADD CONSTRAINT "user_quota_plan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
