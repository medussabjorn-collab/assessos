-- CreateEnum
CREATE TYPE "ScenarioReviewStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "generated_scenarios" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "generatedContent" JSONB NOT NULL,
    "status" "ScenarioReviewStatus" NOT NULL DEFAULT 'pending_review',
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "generated_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_scenarios_tenantId_idx" ON "generated_scenarios"("tenantId");

-- CreateIndex
CREATE INDEX "generated_scenarios_status_idx" ON "generated_scenarios"("status");

-- AddForeignKey
ALTER TABLE "generated_scenarios" ADD CONSTRAINT "generated_scenarios_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_scenarios" ADD CONSTRAINT "generated_scenarios_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
