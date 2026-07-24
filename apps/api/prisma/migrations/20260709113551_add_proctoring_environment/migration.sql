-- CreateEnum
CREATE TYPE "PolicyAction" AS ENUM ('allow', 'flag', 'block');

-- CreateEnum
CREATE TYPE "EnvironmentScanStatus" AS ENUM ('pending', 'clear', 'flagged', 'blocked');

-- CreateTable
CREATE TABLE "proctoring_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "configId" TEXT,
    "requireIdentityVerification" BOOLEAN NOT NULL DEFAULT false,
    "requireLiveness" BOOLEAN NOT NULL DEFAULT false,
    "reverifyIntervalSec" INTEGER NOT NULL DEFAULT 300,
    "requireRoomScan" BOOLEAN NOT NULL DEFAULT false,
    "maxExtraPersons" INTEGER NOT NULL DEFAULT 0,
    "allowSecondScreen" BOOLEAN NOT NULL DEFAULT false,
    "vpnAction" "PolicyAction" NOT NULL DEFAULT 'flag',
    "requireLockdownBrowser" BOOLEAN NOT NULL DEFAULT false,
    "blockRemoteAccess" BOOLEAN NOT NULL DEFAULT true,
    "warningThreshold" INTEGER NOT NULL DEFAULT 30,
    "criticalThreshold" INTEGER NOT NULL DEFAULT 70,
    "autoTerminateThreshold" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proctoring_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_scans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "scanType" TEXT NOT NULL DEFAULT 'pre_session',
    "personsDetected" INTEGER NOT NULL DEFAULT 1,
    "monitorsDetected" INTEGER NOT NULL DEFAULT 1,
    "phoneDetected" BOOLEAN NOT NULL DEFAULT false,
    "notesDetected" BOOLEAN NOT NULL DEFAULT false,
    "whiteboardDetected" BOOLEAN NOT NULL DEFAULT false,
    "lightingOk" BOOLEAN NOT NULL DEFAULT true,
    "faceVisible" BOOLEAN NOT NULL DEFAULT true,
    "audioBaselineDb" DOUBLE PRECISION,
    "ipCountry" TEXT,
    "declaredCountry" TEXT,
    "vpnDetected" BOOLEAN NOT NULL DEFAULT false,
    "proxyDetected" BOOLEAN NOT NULL DEFAULT false,
    "torDetected" BOOLEAN NOT NULL DEFAULT false,
    "lockdownActive" BOOLEAN NOT NULL DEFAULT false,
    "remoteAccessDetected" BOOLEAN NOT NULL DEFAULT false,
    "vmDetected" BOOLEAN NOT NULL DEFAULT false,
    "screenShareDetected" BOOLEAN NOT NULL DEFAULT false,
    "status" "EnvironmentScanStatus" NOT NULL DEFAULT 'pending',
    "findings" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proctoring_policies_tenantId_idx" ON "proctoring_policies"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "proctoring_policies_tenantId_configId_key" ON "proctoring_policies"("tenantId", "configId");

-- CreateIndex
CREATE INDEX "environment_scans_tenantId_idx" ON "environment_scans"("tenantId");

-- CreateIndex
CREATE INDEX "environment_scans_userId_idx" ON "environment_scans"("userId");

-- CreateIndex
CREATE INDEX "environment_scans_sessionId_idx" ON "environment_scans"("sessionId");

-- CreateIndex
CREATE INDEX "environment_scans_status_idx" ON "environment_scans"("status");

-- AddForeignKey
ALTER TABLE "proctoring_policies" ADD CONSTRAINT "proctoring_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_scans" ADD CONSTRAINT "environment_scans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_scans" ADD CONSTRAINT "environment_scans_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
