-- Remove REJECTED from JobStatus enum
-- First, update any existing REJECTED jobs to CLOSED
UPDATE "Job" SET status = 'CLOSED' WHERE status = 'REJECTED';

-- AlterEnum - need to create new type and cast properly
CREATE TYPE "JobStatus_new" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'CLOSED');
ALTER TABLE "Job" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "JobStatus_new" USING (
  CASE 
    WHEN "status"::text = 'REJECTED' THEN 'CLOSED'::text
    ELSE "status"::text
  END::"JobStatus_new"
);
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Change isApproved default to true
ALTER TABLE "Company" ALTER COLUMN "isApproved" SET DEFAULT true;
