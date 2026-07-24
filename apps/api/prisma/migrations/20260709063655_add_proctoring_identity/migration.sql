-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('pending', 'verified', 'failed', 'manual_review');

-- CreateEnum
CREATE TYPE "LivenessMode" AS ENUM ('passive', 'active');

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "biometricHash" TEXT,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "ipHash" TEXT,
ADD COLUMN     "proctoringRevoked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "documentType" TEXT,
    "documentVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentScore" DOUBLE PRECISION,
    "faceMatchScore" DOUBLE PRECISION,
    "livenessPassed" BOOLEAN NOT NULL DEFAULT false,
    "livenessMode" "LivenessMode" NOT NULL DEFAULT 'passive',
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'pending',
    "reverifiedAt" TIMESTAMP(3),
    "reverifyCount" INTEGER NOT NULL DEFAULT 0,
    "driftDetected" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_verifications_tenantId_idx" ON "identity_verifications"("tenantId");

-- CreateIndex
CREATE INDEX "identity_verifications_userId_idx" ON "identity_verifications"("userId");

-- CreateIndex
CREATE INDEX "identity_verifications_sessionId_idx" ON "identity_verifications"("sessionId");

-- CreateIndex
CREATE INDEX "identity_verifications_status_idx" ON "identity_verifications"("status");

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
