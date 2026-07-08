import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EeoAgeBand, EeoGender, EeoRaceEthnicity } from '@prisma/client';

export interface SubmitSelfIdInput {
  gender?: EeoGender;
  raceEthnicity?: EeoRaceEthnicity;
  ageBand?: EeoAgeBand;
}

// EU + EEA (GDPR applies EEA-wide via the EEA Agreement, not just to EU
// member states). UK GDPR is a separate near-identical regime NOT covered
// here — residual gap, not an oversight: see the compliance-tracking doc.
const GDPR_JURISDICTION_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', // EU
  'IS', 'LI', 'NO', // EEA (non-EU)
]);

@Injectable({ scope: Scope.REQUEST })
export class SelfIdService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  // Blocks self-ID collection until consent capture + privacy notice +
  // access/erasure endpoints exist for these jurisdictions (GDPR Art. 9
  // special-category data; CCPA/CPRA sensitive personal information).
  // Unknown/missing jurisdiction does NOT block — see the `country` field
  // comment in schema.prisma for why, and treat that as a residual gap,
  // not a clearance.
  private isRestrictedJurisdiction(
    country: string | null,
    usState: string | null,
  ): boolean {
    if (!country) return false;
    if (GDPR_JURISDICTION_COUNTRIES.has(country)) return true;
    if (country === 'US' && usState === 'CA') return true;
    return false;
  }

  async submit(candidateId: string, input: SubmitSelfIdInput) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (this.isRestrictedJurisdiction(candidate.country, candidate.usState)) {
      throw new ForbiddenException(
        'Self-ID collection is disabled for EU/EEA and California candidates ' +
          'until consent capture, privacy notice, and data-subject access/erasure ' +
          'endpoints are in place.',
      );
    }

    return this.prisma.candidateSelfId.upsert({
      where: { candidateId },
      create: {
        tenantId: this.tenantId,
        candidateId,
        gender: input.gender ?? 'decline_to_state',
        raceEthnicity: input.raceEthnicity ?? 'decline_to_state',
        ageBand: input.ageBand ?? 'decline_to_state',
      },
      update: {
        gender: input.gender ?? 'decline_to_state',
        raceEthnicity: input.raceEthnicity ?? 'decline_to_state',
        ageBand: input.ageBand ?? 'decline_to_state',
        submittedAt: new Date(),
      },
    });
  }
}
