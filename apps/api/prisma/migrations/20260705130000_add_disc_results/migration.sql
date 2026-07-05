-- CreateTable
CREATE TABLE "disc_results" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "primaryType" TEXT NOT NULL,
    "secondaryType" TEXT,
    "profileLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disc_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disc_results_tenantId_idx" ON "disc_results"("tenantId");

-- CreateIndex
CREATE INDEX "disc_results_userId_idx" ON "disc_results"("userId");

-- AddForeignKey
ALTER TABLE "disc_results" ADD CONSTRAINT "disc_results_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disc_results" ADD CONSTRAINT "disc_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

