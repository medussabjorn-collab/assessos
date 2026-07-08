import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface GrantConsentInput {
  scope: string[];
  retentionDays: number;
}

// BIPA / Illinois AI Video Interview Act consent gate. See the
// BiometricConsent model comment in schema.prisma for why this exists and
// what it's checked against (ProctoringService.monitorSession, via
// InterviewService.startInterview).
@Injectable({ scope: Scope.REQUEST })
export class BiometricConsentService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  private async requireCandidate(candidateId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async grant(candidateId: string, input: GrantConsentInput) {
    await this.requireCandidate(candidateId);

    if (!input.scope || input.scope.length === 0) {
      throw new Error('Consent must specify at least one biometric scope');
    }

    const now = new Date();
    const retentionExpiresAt = new Date(
      now.getTime() + input.retentionDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.biometricConsent.upsert({
      where: { candidateId },
      create: {
        tenantId: this.tenantId,
        candidateId,
        consentGiven: true,
        scope: input.scope,
        consentedAt: now,
        retentionExpiresAt,
        revokedAt: null,
      },
      update: {
        consentGiven: true,
        scope: input.scope,
        consentedAt: now,
        retentionExpiresAt,
        revokedAt: null,
      },
    });
  }

  async revoke(candidateId: string) {
    await this.requireCandidate(candidateId);

    return this.prisma.biometricConsent.upsert({
      where: { candidateId },
      create: {
        tenantId: this.tenantId,
        candidateId,
        consentGiven: false,
        scope: [],
        revokedAt: new Date(),
      },
      update: {
        consentGiven: false,
        revokedAt: new Date(),
      },
    });
  }

  // The actual gate: does this candidate have active, non-expired,
  // scope-matching consent right now? Missing consent, revoked consent,
  // expired retention window, or a scope that doesn't cover what's about
  // to be collected all fail closed (return false).
  async hasActiveConsent(candidateId: string, requiredScope: string): Promise<boolean> {
    const consent = await this.prisma.biometricConsent.findUnique({
      where: { candidateId },
    });
    if (!consent || !consent.consentGiven || consent.revokedAt) return false;
    if (!consent.retentionExpiresAt || consent.retentionExpiresAt < new Date()) return false;

    const scope = consent.scope as string[];
    return Array.isArray(scope) && scope.includes(requiredScope);
  }
}
