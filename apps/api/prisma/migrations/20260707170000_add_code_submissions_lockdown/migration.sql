-- CreateTable
CREATE TABLE "code_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "matchedSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lockdown_violations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lockdown_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "code_submissions_tenantId_idx" ON "code_submissions"("tenantId");

-- CreateIndex
CREATE INDEX "code_submissions_problemId_language_idx" ON "code_submissions"("problemId", "language");

-- CreateIndex
CREATE INDEX "lockdown_violations_tenantId_idx" ON "lockdown_violations"("tenantId");

-- CreateIndex
CREATE INDEX "lockdown_violations_userId_idx" ON "lockdown_violations"("userId");

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lockdown_violations" ADD CONSTRAINT "lockdown_violations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lockdown_violations" ADD CONSTRAINT "lockdown_violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
