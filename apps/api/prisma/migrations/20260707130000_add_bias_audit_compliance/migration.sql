-- CreateEnum
CREATE TYPE "EeoGender" AS ENUM ('female', 'male', 'non_binary', 'decline_to_state');

-- CreateEnum
CREATE TYPE "EeoRaceEthnicity" AS ENUM ('hispanic_or_latino', 'white', 'black_or_african_american', 'native_hawaiian_or_pacific_islander', 'asian', 'american_indian_or_alaska_native', 'two_or_more_races', 'decline_to_state');

-- CreateEnum
CREATE TYPE "EeoAgeBand" AS ENUM ('under_40', 'forty_and_over', 'decline_to_state');

-- CreateEnum
CREATE TYPE "HiringDecisionOutcome" AS ENUM ('advanced', 'rejected');

-- CreateTable
CREATE TABLE "candidate_self_id" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "gender" "EeoGender" NOT NULL DEFAULT 'decline_to_state',
    "raceEthnicity" "EeoRaceEthnicity" NOT NULL DEFAULT 'decline_to_state',
    "ageBand" "EeoAgeBand" NOT NULL DEFAULT 'decline_to_state',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_self_id_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_decision_audit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fromStage" "PipelineStage" NOT NULL,
    "toStage" "PipelineStage" NOT NULL,
    "outcome" "HiringDecisionOutcome" NOT NULL,
    "technicalScore" DOUBLE PRECISION,
    "cultureFitScore" DOUBLE PRECISION,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_decision_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_self_id_candidateId_key" ON "candidate_self_id"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_self_id_tenantId_idx" ON "candidate_self_id"("tenantId");

-- CreateIndex
CREATE INDEX "hiring_decision_audit_tenantId_idx" ON "hiring_decision_audit"("tenantId");

-- CreateIndex
CREATE INDEX "hiring_decision_audit_candidateId_idx" ON "hiring_decision_audit"("candidateId");

-- AddForeignKey
ALTER TABLE "candidate_self_id" ADD CONSTRAINT "candidate_self_id_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_self_id" ADD CONSTRAINT "candidate_self_id_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_decision_audit" ADD CONSTRAINT "hiring_decision_audit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_decision_audit" ADD CONSTRAINT "hiring_decision_audit_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
