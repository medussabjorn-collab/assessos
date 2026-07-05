-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "answersMetadata" JSONB;

