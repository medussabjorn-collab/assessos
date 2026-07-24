-- CreateEnum
CREATE TYPE "DecisionReviewStatus" AS ENUM ('pending', 'in_review', 'resolved');

-- CreateTable
CREATE TABLE "decision_review_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT,
    "status" "DecisionReviewStatus" NOT NULL DEFAULT 'pending',
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "decision_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decision_review_requests_tenantId_idx" ON "decision_review_requests"("tenantId");

-- CreateIndex
CREATE INDEX "decision_review_requests_reportId_idx" ON "decision_review_requests"("reportId");

-- CreateIndex
CREATE INDEX "decision_review_requests_status_idx" ON "decision_review_requests"("status");

-- AddForeignKey
ALTER TABLE "decision_review_requests" ADD CONSTRAINT "decision_review_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_review_requests" ADD CONSTRAINT "decision_review_requests_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ai_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_review_requests" ADD CONSTRAINT "decision_review_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_review_requests" ADD CONSTRAINT "decision_review_requests_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
