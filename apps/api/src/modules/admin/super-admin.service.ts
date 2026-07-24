import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async listOrganizations() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            assessmentSessions: true,
            aiReports: true,
          },
        },
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      users: tenant._count.users,
      assessments: tenant._count.assessmentSessions,
      reports: tenant._count.aiReports,
      subscription: tenant.subscriptions[0] || null,
    }));
  }

  async getOrganization(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: { select: { name: true } },
            createdAt: true,
          },
        },
        subscriptions: true,
        _count: {
          select: {
            assessmentSessions: true,
            aiReports: true,
          },
        },
      },
    });
    if (!tenant) return null;

    // Keep the API's `role` field a plain string, same shape as before RBAC —
    // the caller doesn't need the full Role relation, just its name.
    return {
      ...tenant,
      users: tenant.users.map((u) => ({ ...u, role: u.role.name })),
    };
  }

  async disableOrganization(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...(tenant?.settings as Record<string, any> | null ?? {}),
          disabled: true,
          disabledAt: new Date().toISOString(),
        },
      },
    });
  }

  async enableOrganization(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...(tenant?.settings as Record<string, any> | null ?? {}),
          disabled: false,
          disabledAt: null,
        },
      },
    });
  }

  async getOrgUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: { select: { name: true } },
        department: true,
        createdAt: true,
        _count: {
          select: {
            assessmentSessions: true,
            aiReports: true,
          },
        },
      },
    });

    return users.map((u) => ({ ...u, role: u.role.name }));
  }

  async checkUsageAlerts(): Promise<
    Array<{
      tenantId: string;
      tenantName: string;
      alertType: string;
      message: string;
    }>
  > {
    const alerts: Array<{
      tenantId: string;
      tenantName: string;
      alertType: string;
      message: string;
    }> = [];

    const subscriptions = await this.prisma.subscription.findMany({
      include: { tenant: true },
    });

    for (const sub of subscriptions) {
      // Check if credit usage is high
      // TODO: Implement actual usage tracking
      // For now, just return sample alert structure

      if (sub.assessmentCredits < 20) {
        alerts.push({
          tenantId: sub.tenantId,
          tenantName: sub.tenant.name,
          alertType: 'low_credits',
          message: `Assessment credits running low: ${sub.assessmentCredits} remaining`,
        });
      }
    }

    return alerts;
  }
}
