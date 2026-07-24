-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('face_cam', 'room_cam', 'screen', 'audio', 'snapshot', 'clip', 'document');

-- CreateTable
CREATE TABLE "evidence_artifacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "EvidenceType" NOT NULL,
    "storageRef" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "durationSec" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrity_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "entryType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "prevHash" TEXT NOT NULL,
    "entryHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_artifacts_tenantId_idx" ON "evidence_artifacts"("tenantId");

-- CreateIndex
CREATE INDEX "evidence_artifacts_sessionId_idx" ON "evidence_artifacts"("sessionId");

-- CreateIndex
CREATE INDEX "integrity_log_tenantId_idx" ON "integrity_log"("tenantId");

-- CreateIndex
CREATE INDEX "integrity_log_sessionId_idx" ON "integrity_log"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "integrity_log_sessionId_seq_key" ON "integrity_log"("sessionId", "seq");

-- AddForeignKey
ALTER TABLE "evidence_artifacts" ADD CONSTRAINT "evidence_artifacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_artifacts" ADD CONSTRAINT "evidence_artifacts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_log" ADD CONSTRAINT "integrity_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_log" ADD CONSTRAINT "integrity_log_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
