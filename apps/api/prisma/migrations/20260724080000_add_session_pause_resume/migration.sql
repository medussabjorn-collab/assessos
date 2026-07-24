-- Pause/resume support for assessment sessions.
ALTER TYPE "SessionStatus" ADD VALUE 'paused';

ALTER TABLE "assessment_sessions" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "assessment_sessions" ADD COLUMN "totalPausedSec" INTEGER NOT NULL DEFAULT 0;
