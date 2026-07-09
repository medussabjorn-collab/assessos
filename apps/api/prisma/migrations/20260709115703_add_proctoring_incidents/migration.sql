-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'in_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "IncidentResolution" AS ENUM ('no_action', 'warning_issued', 'result_flagged', 'result_cancelled', 'candidate_banned');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('none', 'requested', 'under_review', 'upheld', 'overturned');

-- CreateTable
CREATE TABLE "proctoring_incidents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "riskScore" INTEGER,
    "description" TEXT,
    "openedBy" TEXT NOT NULL DEFAULT 'system',
    "assignedTo" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "resolution" "IncidentResolution",
    "resolutionNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appealStatus" "AppealStatus" NOT NULL DEFAULT 'none',
    "appealReason" TEXT,
    "appealResolvedById" TEXT,
    "appealResolvedAt" TIMESTAMP(3),
    "appealNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proctoring_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proctoring_incidents_tenantId_idx" ON "proctoring_incidents"("tenantId");

-- CreateIndex
CREATE INDEX "proctoring_incidents_sessionId_idx" ON "proctoring_incidents"("sessionId");

-- CreateIndex
CREATE INDEX "proctoring_incidents_status_idx" ON "proctoring_incidents"("status");

-- CreateIndex
CREATE INDEX "proctoring_incidents_severity_idx" ON "proctoring_incidents"("severity");

-- AddForeignKey
ALTER TABLE "proctoring_incidents" ADD CONSTRAINT "proctoring_incidents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_incidents" ADD CONSTRAINT "proctoring_incidents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
