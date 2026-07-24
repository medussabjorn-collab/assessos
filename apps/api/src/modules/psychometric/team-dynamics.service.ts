import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DiscDimension } from './models/disc.model';

// DISC-theory-based heuristic, not a validated predictive model. DISC
// literature (Marston's original framework and standard practitioner
// material) documents that same-dimension pairs on D or C can produce
// friction (competing for control / competing on precision), while
// opposite-axis pairs (D-S, I-C) tend to need deliberate communication
// bridging since their defaults differ most. This encodes that established
// qualitative guidance as structured notes — it does not claim to predict
// outcomes, and callers should not treat the "compatibility" label as a
// score with statistical backing.
export interface PairNote {
  userIdA: string;
  userIdB: string;
  primaryA: DiscDimension;
  primaryB: DiscDimension;
  note: string;
}

const FRICTION_NOTES: Partial<Record<string, string>> = {
  DD: 'Two high-D profiles: watch for competing for control/direction on decisions.',
  CC: 'Two high-C profiles: watch for over-analysis slowing decisions; both may over-index on precision.',
  DS: 'D-S pairing: D moves fast and decisively, S prefers steady consensus — mismatched pace is the likely friction point.',
  SD: 'D-S pairing: D moves fast and decisively, S prefers steady consensus — mismatched pace is the likely friction point.',
  IC: 'I-C pairing: I favors big-picture/relational communication, C favors detail/precision — misaligned communication style is the likely friction point.',
  CI: 'I-C pairing: I favors big-picture/relational communication, C favors detail/precision — misaligned communication style is the likely friction point.',
};

const COMPLEMENT_NOTES: Partial<Record<string, string>> = {
  DI: 'D-I pairing: complementary — D drives decisions, I builds buy-in and energy around them.',
  ID: 'D-I pairing: complementary — D drives decisions, I builds buy-in and energy around them.',
  SC: 'S-C pairing: complementary — S maintains team stability, C ensures rigor and accuracy.',
  CS: 'S-C pairing: complementary — S maintains team stability, C ensures rigor and accuracy.',
  IS: 'I-S pairing: complementary — I brings energy, S brings follow-through and steadiness.',
  SI: 'I-S pairing: complementary — I brings energy, S brings follow-through and steadiness.',
  DC: 'D-C pairing: complementary when D respects C\'s need for detail before deciding — otherwise a pace mismatch.',
  CD: 'D-C pairing: complementary when D respects C\'s need for detail before deciding — otherwise a pace mismatch.',
};

@Injectable({ scope: Scope.REQUEST })
export class TeamDynamicsService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async predictTeamDynamics(userIds: string[]) {
    const results = await this.prisma.psychometricResult.findMany({
      where: { tenantId: this.tenantId, userId: { in: userIds }, modelKey: 'disc' },
      orderBy: { createdAt: 'desc' },
    });

    // Latest DISC result per user.
    const latestByUser = new Map<string, (typeof results)[number]>();
    for (const r of results) {
      if (!latestByUser.has(r.userId)) latestByUser.set(r.userId, r);
    }

    const missingDiscData = userIds.filter((id) => !latestByUser.has(id));

    const primaryOf = (userId: string): DiscDimension | null => {
      const interpretation = latestByUser.get(userId)?.interpretation as
        | { primaryType?: DiscDimension }
        | undefined;
      return interpretation?.primaryType ?? null;
    };

    const pairNotes: PairNote[] = [];
    const availableUserIds = userIds.filter((id) => latestByUser.has(id));
    for (let i = 0; i < availableUserIds.length; i++) {
      for (let j = i + 1; j < availableUserIds.length; j++) {
        const userIdA = availableUserIds[i];
        const userIdB = availableUserIds[j];
        const primaryA = primaryOf(userIdA);
        const primaryB = primaryOf(userIdB);
        if (!primaryA || !primaryB) continue;

        const key = `${primaryA}${primaryB}`;
        const note =
          FRICTION_NOTES[key] ??
          COMPLEMENT_NOTES[key] ??
          `${primaryA}-${primaryB} pairing: no specific friction/complement pattern documented for this combination.`;

        pairNotes.push({ userIdA, userIdB, primaryA, primaryB, note });
      }
    }

    // Diversity, not similarity: how many of the 4 DISC primary types are
    // represented on the team. Higher spread is commonly cited (in DISC
    // practitioner literature) as reducing blind spots, not as a proven
    // performance predictor.
    const representedPrimaries = new Set(
      availableUserIds.map(primaryOf).filter((p): p is DiscDimension => p != null),
    );

    return {
      teamSize: userIds.length,
      missingDiscData,
      discDiversityScore: representedPrimaries.size / 4,
      pairNotes,
      methodologyNote:
        'DISC-theory-based heuristic notes, not a validated predictive model. Based on ' +
        'established qualitative DISC practitioner guidance about pairing dynamics, not a ' +
        'trained or statistically validated compatibility score.',
    };
  }
}
