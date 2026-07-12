ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;

ALTER TABLE "candidate_resume"
  ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
