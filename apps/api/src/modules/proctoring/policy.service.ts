import { Injectable } from '@nestjs/common';
import { PolicyAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface EffectivePolicy {
  requireIdentityVerification: boolean;
  requireLiveness: boolean;
  reverifyIntervalSec: number;
  requireRoomScan: boolean;
  maxExtraPersons: number;
  allowSecondScreen: boolean;
  vpnAction: PolicyAction;
  requireLockdownBrowser: boolean;
  blockRemoteAccess: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  autoTerminateThreshold: number;
}

export const DEFAULT_POLICY: EffectivePolicy = {
  requireIdentityVerification: false,
  requireLiveness: false,
  reverifyIntervalSec: 300,
  requireRoomScan: false,
  maxExtraPersons: 0,
  allowSecondScreen: false,
  vpnAction: 'flag',
  requireLockdownBrowser: false,
  blockRemoteAccess: true,
  warningThreshold: 30,
  criticalThreshold: 70,
  autoTerminateThreshold: 100,
};

/**
 * Per-tenant / per-config proctoring policy. Resolution order:
 *   config-specific policy -> tenant default (configId null) -> built-in
 *   DEFAULT_POLICY.
 */
@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffective(tenantId: string, configId?: string | null): Promise<EffectivePolicy> {
    if (configId) {
      const specific = await this.prisma.proctoringPolicy.findFirst({
        where: { tenantId, configId },
      });
      if (specific) return this.strip(specific);
    }
    const tenantDefault = await this.prisma.proctoringPolicy.findFirst({
      where: { tenantId, configId: null },
    });
    if (tenantDefault) return this.strip(tenantDefault);
    return { ...DEFAULT_POLICY };
  }

  async upsert(tenantId: string, configId: string | null, dto: Partial<EffectivePolicy>) {
    // Manual find-then-write: a compound unique containing NULL doesn't match
    // reliably via prisma.upsert, so resolve the row explicitly.
    const existing = await this.prisma.proctoringPolicy.findFirst({
      where: { tenantId, configId },
    });
    if (existing) {
      return this.prisma.proctoringPolicy.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.proctoringPolicy.create({
      data: { tenantId, configId, ...dto },
    });
  }

  private strip(p: EffectivePolicy & Record<string, unknown>): EffectivePolicy {
    return {
      requireIdentityVerification: p.requireIdentityVerification,
      requireLiveness: p.requireLiveness,
      reverifyIntervalSec: p.reverifyIntervalSec,
      requireRoomScan: p.requireRoomScan,
      maxExtraPersons: p.maxExtraPersons,
      allowSecondScreen: p.allowSecondScreen,
      vpnAction: p.vpnAction,
      requireLockdownBrowser: p.requireLockdownBrowser,
      blockRemoteAccess: p.blockRemoteAccess,
      warningThreshold: p.warningThreshold,
      criticalThreshold: p.criticalThreshold,
      autoTerminateThreshold: p.autoTerminateThreshold,
    };
  }
}
