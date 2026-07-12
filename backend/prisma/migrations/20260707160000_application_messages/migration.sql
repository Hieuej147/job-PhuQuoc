-- Application-scoped chat messages.
DO $$ BEGIN
  CREATE TYPE "ApplicationMessageSenderRole" AS ENUM ('CANDIDATE', 'EMPLOYER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "application_message" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderRole" "ApplicationMessageSenderRole" NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "hiddenForCandidate" BOOLEAN NOT NULL DEFAULT false,
  "hiddenForEmployer" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "application_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "application_message_applicationId_createdAt_idx"
  ON "application_message"("applicationId", "createdAt");

CREATE INDEX IF NOT EXISTS "application_message_senderId_createdAt_idx"
  ON "application_message"("senderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "application_message"
    ADD CONSTRAINT "application_message_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "job_application"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "application_message"
    ADD CONSTRAINT "application_message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
