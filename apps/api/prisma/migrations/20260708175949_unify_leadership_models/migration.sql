-- CreateEnum
CREATE TYPE "AssessmentModuleId" AS ENUM ('technical', 'attitude', 'behavioral', 'psychometric', 'communication');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('login', 'logout', 'register', 'assessment_started', 'assessment_submitted', 'assessment_graded', 'proctor_event', 'config_updated', 'user_created', 'user_updated', 'user_deleted', 'report_generated', 'integration_connected', 'integration_disconnected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'candidate';
ALTER TYPE "Role" ADD VALUE 'recruiter';
ALTER TYPE "Role" ADD VALUE 'viewer';

-- AlterTable
ALTER TABLE "assessment_configs" ADD COLUMN     "adaptiveMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moduleId" "AssessmentModuleId",
ADD COLUMN     "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negativePenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "currentIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "moduleId" "AssessmentModuleId",
ADD COLUMN     "offlineToken" TEXT,
ADD COLUMN     "questionOrder" TEXT[],
ADD COLUMN     "timeSpentSec" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "maxSeats" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "session_answers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" INTEGER,
    "isCorrect" BOOLEAN,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "timeSpentSec" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "moduleId" "AssessmentModuleId",
    "score" DOUBLE PRECISION NOT NULL,
    "percentile" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "wrongAnswers" INTEGER NOT NULL,
    "skippedAnswers" INTEGER NOT NULL,
    "irtTheta" DOUBLE PRECISION,
    "irtSe" DOUBLE PRECISION,
    "irtTier" TEXT,
    "subTopicScores" JSONB,
    "aiInsights" TEXT[],
    "proctoringRisk" INTEGER NOT NULL DEFAULT 0,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "riskDelta" INTEGER NOT NULL DEFAULT 0,
    "totalRisk" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_answers_tenantId_idx" ON "session_answers"("tenantId");

-- CreateIndex
CREATE INDEX "session_answers_sessionId_idx" ON "session_answers"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "session_answers_sessionId_questionId_key" ON "session_answers"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_sessionId_key" ON "assessment_results"("sessionId");

-- CreateIndex
CREATE INDEX "assessment_results_tenantId_idx" ON "assessment_results"("tenantId");

-- CreateIndex
CREATE INDEX "assessment_results_userId_idx" ON "assessment_results"("userId");

-- CreateIndex
CREATE INDEX "assessment_results_moduleId_idx" ON "assessment_results"("moduleId");

-- CreateIndex
CREATE INDEX "proctoring_events_tenantId_idx" ON "proctoring_events"("tenantId");

-- CreateIndex
CREATE INDEX "proctoring_events_sessionId_idx" ON "proctoring_events"("sessionId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "integrations_tenantId_idx" ON "integrations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_tenantId_name_key" ON "integrations"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_events" ADD CONSTRAINT "proctoring_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_events" ADD CONSTRAINT "proctoring_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
