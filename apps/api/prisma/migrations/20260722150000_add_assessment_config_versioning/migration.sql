-- Add version tracking to AssessmentConfig. Rows become immutable once
-- created — editing an assessment inserts a new row (same
-- assessmentGroupId, version + 1) instead of updating in place, so
-- AssessmentSession.configId FKs (which are never touched by this migration)
-- keep pointing at the exact version a candidate ran under. Existing rows
-- each become their own group's version 1 (no prior data represented more
-- than one version of anything, since no edit path existed before this).

ALTER TABLE "assessment_configs" ADD COLUMN "assessmentGroupId" TEXT;
ALTER TABLE "assessment_configs" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "assessment_configs" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "assessment_configs" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "assessment_configs"
SET "assessmentGroupId" = "id", "publishedAt" = "createdAt"
WHERE "assessmentGroupId" IS NULL;

ALTER TABLE "assessment_configs" ALTER COLUMN "assessmentGroupId" SET NOT NULL;
ALTER TABLE "assessment_configs" ALTER COLUMN "publishedAt" SET NOT NULL;
ALTER TABLE "assessment_configs" ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "assessment_configs_assessmentGroupId_version_key" ON "assessment_configs"("assessmentGroupId", "version");
CREATE INDEX "assessment_configs_assessmentGroupId_idx" ON "assessment_configs"("assessmentGroupId");
