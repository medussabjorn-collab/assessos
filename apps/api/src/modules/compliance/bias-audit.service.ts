import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EeoAgeBand, EeoGender, EeoRaceEthnicity } from '@prisma/client';

// EEOC/OFCCP four-fifths rule: a group's selection rate is flagged if it's
// less than 80% of the highest-selection-rate group's rate.
const FOUR_FIFTHS_THRESHOLD = 0.8;

// Groups smaller than this are excluded from ratio math and reported as
// suppressed — standard small-cell suppression to avoid both statistically
// meaningless ratios and re-identification of individuals in tiny groups.
const MIN_CELL_SIZE = 5;

interface GroupBreakdown {
  category: string;
  total: number;
  selected?: number;
  selectionRate?: number;
  impactRatio?: number;
  flagged?: boolean;
  suppressed: boolean;
}

export interface AdverseImpactReport {
  jobRoleId: string | null;
  decidedCandidateCount: number;
  selfIdResponseRate: number;
  dimensions: {
    gender: GroupBreakdown[];
    raceEthnicity: GroupBreakdown[];
    ageBand: GroupBreakdown[];
  };
  generatedAt: Date;
}

type Dimension = 'gender' | 'raceEthnicity' | 'ageBand';

@Injectable({ scope: Scope.REQUEST })
export class BiasAuditService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async computeAdverseImpact(jobRoleId?: string): Promise<AdverseImpactReport> {
    const candidates = await this.prisma.candidate.findMany({
      where: {
        tenantId: this.tenantId,
        ...(jobRoleId ? { jobRoleId } : {}),
        // Only final dispositions count toward selection-rate math —
        // candidates still mid-pipeline haven't had a decision made yet.
        stage: { in: ['offer', 'hired', 'rejected'] },
      },
      include: { selfId: true },
    });

    const withSelfId = candidates.filter((c) => c.selfId != null);

    return {
      jobRoleId: jobRoleId ?? null,
      decidedCandidateCount: candidates.length,
      selfIdResponseRate: candidates.length
        ? Math.round((withSelfId.length / candidates.length) * 1000) / 1000
        : 0,
      dimensions: {
        gender: this.breakdownByDimension(withSelfId, 'gender'),
        raceEthnicity: this.breakdownByDimension(withSelfId, 'raceEthnicity'),
        ageBand: this.breakdownByDimension(withSelfId, 'ageBand'),
      },
      generatedAt: new Date(),
    };
  }

  private breakdownByDimension(
    candidates: Array<{
      stage: string;
      selfId: {
        gender: EeoGender;
        raceEthnicity: EeoRaceEthnicity;
        ageBand: EeoAgeBand;
      } | null;
    }>,
    dimension: Dimension,
  ): GroupBreakdown[] {
    const groups = new Map<string, { total: number; selected: number }>();

    for (const c of candidates) {
      const value = c.selfId?.[dimension];
      // Declined-to-state candidates are excluded from this dimension's
      // breakdown entirely — their disposition still counts toward
      // decidedCandidateCount, but they can't be attributed to a group.
      if (!value || value === 'decline_to_state') continue;

      const entry = groups.get(value) ?? { total: 0, selected: 0 };
      entry.total += 1;
      if (c.stage === 'offer' || c.stage === 'hired') entry.selected += 1;
      groups.set(value, entry);
    }

    const rateable = [...groups.entries()].filter(
      ([, g]) => g.total >= MIN_CELL_SIZE,
    );
    const maxRate = rateable.length
      ? Math.max(...rateable.map(([, g]) => g.selected / g.total))
      : null;

    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, g]) => {
        if (g.total < MIN_CELL_SIZE) {
          return { category, total: g.total, suppressed: true };
        }
        const selectionRate = Math.round((g.selected / g.total) * 1000) / 1000;
        const impactRatio =
          maxRate && maxRate > 0
            ? Math.round((selectionRate / maxRate) * 1000) / 1000
            : null;
        return {
          category,
          total: g.total,
          selected: g.selected,
          selectionRate,
          impactRatio: impactRatio ?? undefined,
          flagged: impactRatio != null ? impactRatio < FOUR_FIFTHS_THRESHOLD : false,
          suppressed: false,
        };
      });
  }
}
