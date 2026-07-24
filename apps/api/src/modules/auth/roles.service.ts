import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  }

  async listTenantUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return users;
  }

  async listRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissionKeys: r.permissions.map((rp) => rp.permission.key),
    }));
  }

  async createRole(
    tenantId: string,
    input: { name: string; description?: string; permissionKeys: string[] },
  ) {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
    if (existing) {
      throw new BadRequestException(`A role named "${name}" already exists`);
    }

    const permissions = await this.resolvePermissionIds(input.permissionKeys ?? []);

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name,
        description: input.description ?? null,
        isSystem: false,
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
    });

    return this.getRole(tenantId, role.id);
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    input: { name?: string; description?: string; permissionKeys?: string[] },
  ) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (input.name && input.name.trim() !== role.name) {
      const clash = await this.prisma.role.findUnique({
        where: { tenantId_name: { tenantId, name: input.name.trim() } },
      });
      if (clash) {
        throw new BadRequestException(`A role named "${input.name.trim()}" already exists`);
      }
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: input.name?.trim() ?? undefined,
        description: input.description !== undefined ? input.description : undefined,
      },
    });

    if (input.permissionKeys) {
      const permissions = await this.resolvePermissionIds(input.permissionKeys);
      await this.prisma.rolePermission.deleteMany({ where: { roleId } });
      await this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      });
    }

    return this.getRole(tenantId, roleId);
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    if (role._count.users > 0) {
      throw new BadRequestException(
        `${role._count.users} user(s) still have this role — reassign them first`,
      );
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { deleted: true };
  }

  async assignUserRole(tenantId: string, targetUserId: string, roleId: string, actingUserId: string) {
    if (targetUserId === actingUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.prisma.user.findFirst({ where: { id: targetUserId, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { roleId },
      select: { id: true, email: true, role: { select: { id: true, name: true } } },
    });

    return updated;
  }

  private async getRole(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissionKeys: role.permissions.map((rp) => rp.permission.key),
    };
  }

  private async resolvePermissionIds(keys: string[]) {
    if (keys.length === 0) return [];
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: keys } } });
    const found = new Set(permissions.map((p) => p.key));
    const missing = keys.filter((k) => !found.has(k));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown permission key(s): ${missing.join(', ')}`);
    }
    return permissions;
  }
}
