-- Soft-deactivation flag for users (never hard-delete — cascades would
-- destroy real assessment history). Defaults true so every existing user
-- stays exactly as active as they already were.
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- New permission powering the users-management admin UI (invite/edit/
-- deactivate/reactivate). Same pattern as roles.manage and
-- assessment.configs.manage: grant to every existing org_admin role plus
-- the global super_admin role; new tenants get it automatically via
-- PermissionsService.ensureTenantSystemRoles.
INSERT INTO "permissions" ("id","key","description","category")
VALUES ('users.manage','users.manage','Invite, edit, deactivate, and reactivate users within this organization','platform');

INSERT INTO "role_permissions" ("roleId","permissionId")
SELECT r."id", 'users.manage' FROM "roles" r WHERE r."name" = 'org_admin';

INSERT INTO "role_permissions" ("roleId","permissionId")
VALUES ('global:super_admin', 'users.manage');
