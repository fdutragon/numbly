-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "OraculoAIGenerationQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "generated" TEXT,
    "charCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OraculoAIGenerationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OraculoAIGenerationQueue_status_sent_idx" ON "OraculoAIGenerationQueue"("status", "sent");

-- CreateIndex
CREATE INDEX "OraculoAIGenerationQueue_userId_idx" ON "OraculoAIGenerationQueue"("userId");

-- CreateIndex
CREATE INDEX "OraculoAIGenerationQueue_createdAt_idx" ON "OraculoAIGenerationQueue"("createdAt");

-- AddForeignKey
ALTER TABLE "OraculoAIGenerationQueue" ADD CONSTRAINT "OraculoAIGenerationQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
