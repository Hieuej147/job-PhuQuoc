ALTER TABLE "candidate_resume"
  ADD COLUMN IF NOT EXISTS "isProfile" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "candidate_resume_userId_isProfile_idx"
  ON "candidate_resume"("userId", "isProfile");
