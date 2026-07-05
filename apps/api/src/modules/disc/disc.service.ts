import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import {
  DiscDimension,
  DiscQuestionsService,
} from './disc-questions.service';

export interface DiscAnswer {
  groupId: number;
  most: DiscDimension;
  least: DiscDimension;
}

const DIMENSIONS: DiscDimension[] = ['D', 'I', 'S', 'C'];

const DIMENSION_NAMES: Record<DiscDimension, string> = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

// Primary-secondary blends. Pure types apply when no secondary qualifies.
const PROFILE_LABELS: Record<string, string> = {
  D: 'Driver',
  I: 'Motivator',
  S: 'Stabilizer',
  C: 'Analyst',
  DI: 'Initiator',
  DC: 'Architect',
  DS: 'Achiever',
  ID: 'Persuader',
  IS: 'Encourager',
  IC: 'Assessor',
  SD: 'Specialist',
  SI: 'Counselor',
  SC: 'Coordinator',
  CD: 'Perfectionist',
  CI: 'Appraiser',
  CS: 'Practitioner',
};

@Injectable({ scope: Scope.REQUEST })
export class DiscService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private questions: DiscQuestionsService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  private async resolveUser(firebaseUid: string) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  score(answers: DiscAnswer[]) {
    const groups = this.questions.getGroups();
    if (answers.length !== groups.length) {
      throw new BadRequestException(
        `Expected ${groups.length} answers, got ${answers.length}`,
      );
    }

    const raw: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    const seen = new Set<number>();

    for (const answer of answers) {
      const group = this.questions.getGroup(answer.groupId);
      if (!group || seen.has(answer.groupId)) {
        throw new BadRequestException(`Invalid or duplicate group ${answer.groupId}`);
      }
      if (
        !DIMENSIONS.includes(answer.most) ||
        !DIMENSIONS.includes(answer.least) ||
        answer.most === answer.least
      ) {
        throw new BadRequestException(
          `Group ${answer.groupId}: most and least must be distinct dimensions`,
        );
      }
      seen.add(answer.groupId);
      raw[answer.most] += 1;
      raw[answer.least] -= 1;
    }

    // Raw range per dimension: -N..+N where N = group count. Normalize 0-100.
    const n = groups.length;
    const scores = Object.fromEntries(
      DIMENSIONS.map((d) => [d, Math.round(((raw[d] + n) / (2 * n)) * 100)]),
    ) as Record<DiscDimension, number>;

    const sorted = [...DIMENSIONS].sort((a, b) => scores[b] - scores[a]);
    const primaryType = sorted[0];
    // Secondary qualifies when clearly elevated (above the neutral midpoint)
    // and within 15 points of the primary.
    const secondaryType =
      scores[sorted[1]] > 50 && scores[primaryType] - scores[sorted[1]] <= 15
        ? sorted[1]
        : null;

    const labelKey = secondaryType ? `${primaryType}${secondaryType}` : primaryType;
    const profileLabel = PROFILE_LABELS[labelKey] ?? PROFILE_LABELS[primaryType];

    return {
      scores,
      primaryType,
      secondaryType,
      profileLabel,
      dimensionNames: DIMENSION_NAMES,
    };
  }

  async submit(firebaseUid: string, answers: DiscAnswer[]) {
    const user = await this.resolveUser(firebaseUid);
    const result = this.score(answers);

    const saved = await this.prisma.discResult.create({
      data: {
        tenantId: this.tenantId,
        userId: user.id,
        scores: result.scores,
        primaryType: result.primaryType,
        secondaryType: result.secondaryType,
        profileLabel: result.profileLabel,
      },
    });

    return { id: saved.id, createdAt: saved.createdAt, ...result };
  }

  async getLatestResult(firebaseUid: string) {
    const user = await this.resolveUser(firebaseUid);

    const result = await this.prisma.discResult.findFirst({
      where: { userId: user.id, tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) return null;

    return {
      id: result.id,
      createdAt: result.createdAt,
      scores: result.scores as Record<DiscDimension, number>,
      primaryType: result.primaryType,
      secondaryType: result.secondaryType,
      profileLabel: result.profileLabel,
      dimensionNames: DIMENSION_NAMES,
    };
  }
}
