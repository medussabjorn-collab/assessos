-- Generalize disc_results into psychometric_results so any psychometric
-- model (DISC, Big Five, MBTI, ...) can share one table. Existing DISC
-- rows are preserved and backfilled into the new shape.

ALTER TABLE "disc_results" RENAME TO "psychometric_results";

ALTER TABLE "psychometric_results" ADD COLUMN "modelKey" TEXT NOT NULL DEFAULT 'disc';
ALTER TABLE "psychometric_results" ADD COLUMN "interpretation" JSONB;
ALTER TABLE "psychometric_results" ADD COLUMN "rawAnswers" JSONB;

-- Backfill interpretation from the old primaryType/secondaryType/profileLabel
-- columns for any existing rows.
UPDATE "psychometric_results"
SET "interpretation" = jsonb_build_object(
  'primaryType', "primaryType",
  'secondaryType', "secondaryType",
  'profileLabel', "profileLabel"
)
WHERE "interpretation" IS NULL;

ALTER TABLE "psychometric_results" ALTER COLUMN "interpretation" SET NOT NULL;
ALTER TABLE "psychometric_results" ALTER COLUMN "modelKey" DROP DEFAULT;

ALTER TABLE "psychometric_results" DROP COLUMN "primaryType";
ALTER TABLE "psychometric_results" DROP COLUMN "secondaryType";
ALTER TABLE "psychometric_results" DROP COLUMN "profileLabel";

DROP INDEX IF EXISTS "disc_results_tenantId_idx";
DROP INDEX IF EXISTS "disc_results_userId_idx";

CREATE INDEX "psychometric_results_tenantId_idx" ON "psychometric_results"("tenantId");
CREATE INDEX "psychometric_results_userId_modelKey_idx" ON "psychometric_results"("userId", "modelKey");
