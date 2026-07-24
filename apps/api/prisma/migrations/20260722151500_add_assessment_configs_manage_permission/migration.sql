-- Add the assessment.configs.manage permission (powers the new assessment
-- authoring admin UI) and grant it to every existing org_admin role plus the
-- global super_admin role. New tenants get it automatically via
-- PermissionsService.ensureTenantSystemRoles, which grants org_admin every
-- non-platform permission dynamically.

INSERT INTO "permissions" ("id","key","description","category")
VALUES ('assessment.configs.manage','assessment.configs.manage','Create and edit assessment definitions, publish new versions','assessment');

INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT r."id", 'assessment.configs.manage' FROM "roles" r WHERE r."name" = 'org_admin';

INSERT INTO "role_permissions" ("roleId","permissionId")
VALUES ('global:super_admin', 'assessment.configs.manage');
