-- Add the roles.manage permission (powers the new Roles-management admin UI)
-- and grant it to every existing org_admin role plus the global super_admin
-- role. New tenants get it automatically via
-- PermissionsService.ensureTenantSystemRoles, which grants org_admin every
-- non-platform permission dynamically.

INSERT INTO "permissions" ("id","key","description","category")
VALUES ('roles.manage','roles.manage','Create, edit, and assign custom roles within this organization','platform');

INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT r."id", 'roles.manage' FROM "roles" r WHERE r."name" = 'org_admin';

INSERT INTO "role_permissions" ("roleId","permissionId")
VALUES ('global:super_admin', 'roles.manage');
