-- Add retention and idempotency fields for in-app notification inbox.
ALTER TABLE "notification"
ADD COLUMN "readAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "dedupeKey" TEXT;

DROP INDEX IF EXISTS "notification_userId_idx";

CREATE UNIQUE INDEX "notification_userId_dedupeKey_key" ON "notification"("userId", "dedupeKey");
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");
CREATE INDEX "notification_userId_isRead_createdAt_idx" ON "notification"("userId", "isRead", "createdAt");
CREATE INDEX "notification_expiresAt_idx" ON "notification"("expiresAt");
