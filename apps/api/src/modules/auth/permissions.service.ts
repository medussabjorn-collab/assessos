import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PERMISSIONS } from './permissions.constants';

export interface ResolvedUser {
  id: string;
  tenantId: string;
  firebaseUid: string;
  role: { id: string; name: string; tenantId: string | null };
  permissions: Set<string>;
}

// Manager gets exactly this subset — must stay in sync with the RBAC
// migration's seed (20260722114139_add_rbac_roles_permissions/migration.sql).
const MANAGER_PERMISSION_KEYS = [
  PERMISSIONS.ANALYTICS_RETENTION_RISK_VIEW,
  PERMISSIONS.PSYCHOMETRIC_TEAM_DYNAMICS_VIEW,
  PERMISSIONS.PROCTORING_INCIDENTS_REVIEW,
  PERMISSIONS.PROCTORING_EVIDENCE_REVIEW,
  PERMISSIONS.RATER_FEEDBACK_REVIEW,
];

// The 6 former Role-enum values, minus super_admin (that one's global,
// seeded once at migration time — never per-tenant).
const TENANT_SYSTEM_ROLES = ['org_admin', 'manager', 'employee', 'candidate', 'recruiter', 'viewer'] as const;

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Seed the 6 tenant-scoped system roles (+ default permission grants) for
   * a brand-new tenant — mirrors exactly what the RBAC migration did for
   * every tenant that existed at migration time. Idempotent (upsert), so
   * safe to call even if some roles already exist. Returns roleId by name
   * for the caller to assign a role to their first user.
   */
  async ensureTenantSystemRoles(tenantId: string): Promise<Record<string, string>> {
    const allPermissions = await this.prisma.permission.findMany();
    const nonPlatformPermissions = allPermissions.filter(
      (p) => p.key !== PERMISSIONS.PLATFORM_ORGS_MANAGE,
    );
    const managerPermissions = allPermissions.filter((p) =>
      (MANAGER_PERMISSION_KEYS as readonly string[]).includes(p.key),
    );

    const roleIds: Record<string, string> = {};
    for (const name of TENANT_SYSTEM_ROLES) {
      const id = `${tenantId}:${name}`;
      roleIds[name] = id;
      await this.prisma.role.upsert({
        where: { id },
        update: {},
        create: { id, tenantId, name, isSystem: true },
      });
    }

    // Grant permissions only on first creation (upsert above is a no-op on
    // repeat calls, so skip re-granting if role_permissions already exist).
    const existingGrantCount = await this.prisma.rolePermission.count({
      where: { roleId: roleIds['org_admin'] },
    });
    if (existingGrantCount === 0) {
      await this.prisma.rolePermission.createMany({
        data: nonPlatformPermissions.map((p) => ({ roleId: roleIds['org_admin'], permissionId: p.id })),
      });
      await this.prisma.rolePermission.createMany({
        data: managerPermissions.map((p) => ({ roleId: roleIds['manager'], permissionId: p.id })),
      });
    }

    return roleIds;
  }

  /**
   * Resolve a Firebase-authenticated request into the real User row plus
   * their full permission-key set, in one query. Every RBAC-aware
   * controller/service should go through this instead of re-fetching the
   * user and re-deriving role logic itself.
   */
  async resolveUser(firebaseUid: string, tenantId: string): Promise<ResolvedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
    if (!user) return null;

    return {
      id: user.id,
      tenantId: user.tenantId,
      firebaseUid: user.firebaseUid,
      role: { id: user.role.id, name: user.role.name, tenantId: user.role.tenantId },
      permissions: new Set(user.role.permissions.map((rp) => rp.permission.key)),
    };
  }

  hasPermission(user: ResolvedUser, key: string): boolean {
    return user.permissions.has(key);
  }
}
