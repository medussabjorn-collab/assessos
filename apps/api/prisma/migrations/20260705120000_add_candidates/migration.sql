-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('screening', 'technical', 'culture_fit', 'offer', 'hired', 'rejected');

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobRoleId" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "resumeUrl" TEXT,
    "stage" "PipelineStage" NOT NULL DEFAULT 'screening',
    "technicalScore" DOUBLE PRECISION,
    "cultureFitScore" DOUBLE PRECISION,
    "assessmentSessionId" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidates_tenantId_idx" ON "candidates"("tenantId");

-- CreateIndex
CREATE INDEX "candidates_tenantId_jobRoleId_idx" ON "candidates"("tenantId", "jobRoleId");

-- CreateIndex
CREATE INDEX "candidates_tenantId_stage_idx" ON "candidates"("tenantId", "stage");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

