-- CreateEnum
CREATE TYPE "StudentGender" AS ENUM ('female', 'male', 'prefer_not_to_say');

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "teamSize" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'prelim-marketing-site',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_registrations" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "gender" "StudentGender" NOT NULL,
    "universityName" TEXT NOT NULL,
    "collegeName" TEXT,
    "industry" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_leads_email_idx" ON "marketing_leads"("email");

-- CreateIndex
CREATE INDEX "marketing_leads_createdAt_idx" ON "marketing_leads"("createdAt");

-- CreateIndex
CREATE INDEX "student_registrations_email_idx" ON "student_registrations"("email");

-- CreateIndex
CREATE INDEX "student_registrations_createdAt_idx" ON "student_registrations"("createdAt");
