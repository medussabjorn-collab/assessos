-- CreateEnum
CREATE TYPE "RaterRelationship" AS ENUM ('self', 'manager', 'peer', 'direct_report', 'other');

-- AlterTable
ALTER TABLE "psychometric_results" RENAME CONSTRAINT "disc_results_pkey" TO "psychometric_results_pkey";

-- CreateTable
CREATE TABLE "rater_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "relationship" "RaterRelationship" NOT NULL,
    "ratings" JSONB NOT NULL,
    "comments" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rater_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rater_feedback_tenantId_idx" ON "rater_feedback"("tenantId");

-- CreateIndex
CREATE INDEX "rater_feedback_sessionId_idx" ON "rater_feedback"("sessionId");

-- CreateIndex
CREATE INDEX "rater_feedback_subjectId_idx" ON "rater_feedback"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "rater_feedback_sessionId_raterId_key" ON "rater_feedback"("sessionId", "raterId");

-- RenameForeignKey
ALTER TABLE "psychometric_results" RENAME CONSTRAINT "disc_results_tenantId_fkey" TO "psychometric_results_tenantId_fkey";

-- RenameForeignKey
ALTER TABLE "psychometric_results" RENAME CONSTRAINT "disc_results_userId_fkey" TO "psychometric_results_userId_fkey";

-- AddForeignKey
ALTER TABLE "rater_feedback" ADD CONSTRAINT "rater_feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rater_feedback" ADD CONSTRAINT "rater_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rater_feedback" ADD CONSTRAINT "rater_feedback_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rater_feedback" ADD CONSTRAINT "rater_feedback_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
