-- Replace the fixed Role enum with real RBAC: Role/Permission/RolePermission
-- tables. Hand-written (not `prisma migrate dev` autodiff) because this adds
-- a required column to a non-empty `users` table and needs data backfill
-- Prisma's diff engine can't generate on its own.

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed permission catalog. id = key (both are the same stable string) —
-- deterministic, no UUID-generation dependency, and the id an admin sees in
-- raw data IS the code-referenced key.
INSERT INTO "permissions" ("id","key","description","category") VALUES
('compliance.bias_audit.view','compliance.bias_audit.view','View adverse-impact / bias-audit reports','compliance'),
('compliance.review_requests.manage','compliance.review_requests.manage','View and resolve decision-review requests','compliance'),
('report.explanation.view_any','report.explanation.view_any','View any user''s report explanation, not just your own','compliance'),
('webhooks.manage','webhooks.manage','Manage webhook subscriptions','integrations'),
('integrations.manage','integrations.manage','Connect or disconnect integrations','integrations'),
('assessment.scenarios.manage','assessment.scenarios.manage','Generate and review AI scenarios','assessment'),
('analytics.org_dashboard.view','analytics.org_dashboard.view','View the org-wide analytics dashboard','analytics'),
('analytics.retention_risk.view','analytics.retention_risk.view','View retention-risk analytics','analytics'),
('psychometric.team_dynamics.view','psychometric.team_dynamics.view','View the multi-person DISC / team-dynamics view','analytics'),
('tenant.white_label.manage','tenant.white_label.manage','Manage white-label branding settings','tenant'),
('tenant.sso.manage','tenant.sso.manage','Manage SSO configuration','tenant'),
('proctoring.incidents.review','proctoring.incidents.review','Review proctoring incidents','proctoring'),
('proctoring.incidents.appeals.manage','proctoring.incidents.appeals.manage','Resolve proctoring incident appeals','proctoring'),
('proctoring.evidence.review','proctoring.evidence.review','Review proctoring evidence and the integrity chain','proctoring'),
('proctoring.policy.manage','proctoring.policy.manage','Manage proctoring policy','proctoring'),
('question_bank.write','question_bank.write','Create, edit, or delete question-bank items','assessment'),
('audit_log.view','audit_log.view','View the tenant audit log','compliance'),
('notifications.send','notifications.send','Send notifications to users','tenant'),
('rater_feedback.review','rater_feedback.review','View others'' 360 feedback, not just your own','hiring'),
('platform.orgs.manage','platform.orgs.manage','Manage every organization on the platform (super admin only)','platform');

-- Seed the one global super_admin role (tenantId NULL — acts across every
-- tenant) and grant it every permission that exists.
INSERT INTO "roles" ("id","tenantId","name","description","isSystem","updatedAt")
VALUES ('global:super_admin', NULL, 'super_admin', 'Platform operator — manages every organization', true, CURRENT_TIMESTAMP);

INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT 'global:super_admin', "id" FROM "permissions";

-- Seed the 6 former enum values as tenant-scoped system roles, once per
-- existing tenant. Deterministic id = tenantId:name so backfill below can
-- compute it directly instead of a lookup join.
INSERT INTO "roles" ("id","tenantId","name","description","isSystem","updatedAt")
SELECT t."id" || ':org_admin', t."id", 'org_admin', 'Full administrative access within this organization', true, CURRENT_TIMESTAMP FROM "tenants" t
UNION ALL
SELECT t."id" || ':manager', t."id", 'manager', 'Team oversight — analytics, proctoring review, feedback review', true, CURRENT_TIMESTAMP FROM "tenants" t
UNION ALL
SELECT t."id" || ':employee', t."id", 'employee', 'Standard assessment-taking access', true, CURRENT_TIMESTAMP FROM "tenants" t
UNION ALL
SELECT t."id" || ':candidate', t."id", 'candidate', 'Hiring-pipeline candidate access', true, CURRENT_TIMESTAMP FROM "tenants" t
UNION ALL
SELECT t."id" || ':recruiter', t."id", 'recruiter', 'Recruiting workflow access', true, CURRENT_TIMESTAMP FROM "tenants" t
UNION ALL
SELECT t."id" || ':viewer', t."id", 'viewer', 'Read-only access', true, CURRENT_TIMESTAMP FROM "tenants" t;

-- org_admin gets every permission except the platform-only one (matches the
-- current `role !== 'org_admin' && role !== 'super_admin'` checks exactly).
INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT r."id", p."id" FROM "roles" r, "permissions" p
WHERE r."name" = 'org_admin' AND p."key" != 'platform.orgs.manage';

-- manager gets exactly the manager-tier subset found in the real
-- ['manager','org_admin','super_admin'] checks.
INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT r."id", p."id" FROM "roles" r, "permissions" p
WHERE r."name" = 'manager' AND p."key" IN (
  'analytics.retention_risk.view',
  'psychometric.team_dynamics.view',
  'proctoring.incidents.review',
  'proctoring.evidence.review',
  'rater_feedback.review'
);
-- employee/candidate/recruiter/viewer get nothing — the audit found these
-- four enum values were never actually checked against anywhere.

-- Add the new FK column, backfill from the old enum column, then swap over.
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

UPDATE "users" u
SET "roleId" = CASE
  WHEN u."role" = 'super_admin' THEN 'global:super_admin'
  ELSE u."tenantId" || ':' || u."role"::text
END;

ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "users_role_idx";
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "Role";
