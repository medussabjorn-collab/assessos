-- Predictive talent analytics: ground-truth outcome tracking +
-- persisted prediction snapshots. See the model comments in schema.prisma
-- for why these exist (no labeled outcome data existed to validate the
-- retention-risk heuristic against, let alone train real ML on).

-- CreateEnum
CREATE TYPE "TalentOutcomeType" AS ENUM ('departure_voluntary', 'departure_involuntary', 'promotion', 'performance_rating');

-- CreateEnum
CREATE TYPE "TalentPredictionType" AS ENUM ('retention_risk', 'promotion_readiness', 'performance_forecast');

-- CreateTable
CREATE TABLE "talent_outcomes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outcomeType" "TalentOutcomeType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_prediction_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionType" "TalentPredictionType" NOT NULL,
    "result" JSONB NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_prediction_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "talent_outcomes_tenantId_idx" ON "talent_outcomes"("tenantId");
CREATE INDEX "talent_outcomes_userId_idx" ON "talent_outcomes"("userId");
CREATE INDEX "talent_outcomes_outcomeType_idx" ON "talent_outcomes"("outcomeType");

CREATE INDEX "talent_prediction_snapshots_tenantId_idx" ON "talent_prediction_snapshots"("tenantId");
CREATE INDEX "talent_prediction_snapshots_userId_idx" ON "talent_prediction_snapshots"("userId");
CREATE INDEX "talent_prediction_snapshots_predictionType_idx" ON "talent_prediction_snapshots"("predictionType");

-- AddForeignKey
ALTER TABLE "talent_outcomes" ADD CONSTRAINT "talent_outcomes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "talent_outcomes" ADD CONSTRAINT "talent_outcomes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "talent_outcomes" ADD CONSTRAINT "talent_outcomes_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "talent_prediction_snapshots" ADD CONSTRAINT "talent_prediction_snapshots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "talent_prediction_snapshots" ADD CONSTRAINT "talent_prediction_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
