-- CreateEnum
CREATE TYPE "ChatAgentType" AS ENUM ('CANDIDATE', 'RECRUITER');

-- CreateTable
CREATE TABLE "chat_thread" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "agentType" "ChatAgentType" NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Cuộc trò chuyện mới',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_thread_userId_agentType_updatedAt_idx" ON "chat_thread"("userId", "agentType", "updatedAt");

-- AddForeignKey
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
