import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AssessmentConfigInput {
  pillar?: string;
  dimensions?: any[];
  timeLimitMin?: number;
  passMark?: number;
  aiProctoring?: boolean;
  benchmarkGroup?: string | null;
  moduleId?: string | null;
  negativeMarking?: boolean;
  negativePenalty?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  adaptiveMode?: boolean;
  totalQuestions?: number;
}

const VERSIONED_FIELDS = [
  'pillar',
  'dimensions',
  'timeLimitMin',
  'passMark',
  'aiProctoring',
  'benchmarkGroup',
  'moduleId',
  'negativeMarking',
  'negativePenalty',
  'shuffleQuestions',
  'shuffleOptions',
  'adaptiveMode',
  'totalQuestions',
] as const;

@Injectable()
export class AssessmentConfigService {
  constructor(private prisma: PrismaService) {}

  async listCurrent(tenantId: string) {
    return this.prisma.assessmentConfig.findMany({
      where: { tenantId, isCurrent: true },
      orderBy: { pillar: 'asc' },
    });
  }

  async listVersions(tenantId: string, assessmentGroupId: string) {
    const versions = await this.prisma.assessmentConfig.findMany({
      where: { tenantId, assessmentGroupId },
      orderBy: { version: 'desc' },
    });
    if (versions.length === 0) {
      throw new NotFoundException('Assessment not found');
    }
    return versions;
  }

  async get(tenantId: string, id: string) {
    const config = await this.prisma.assessmentConfig.findFirst({ where: { id, tenantId } });
    if (!config) {
      throw new NotFoundException('Assessment config not found');
    }
    return config;
  }

  async create(tenantId: string, input: AssessmentConfigInput) {
    if (input.timeLimitMin == null || input.passMark == null) {
      throw new BadRequestException('timeLimitMin and passMark are required');
    }

    const created = await this.prisma.assessmentConfig.create({
      data: {
        tenantId,
        assessmentGroupId: '', // set to its own id immediately below
        pillar: input.pillar,
        dimensions: input.dimensions ?? [],
        timeLimitMin: input.timeLimitMin,
        passMark: input.passMark,
        aiProctoring: input.aiProctoring,
        benchmarkGroup: input.benchmarkGroup,
        moduleId: input.moduleId as any,
        negativeMarking: input.negativeMarking,
        negativePenalty: input.negativePenalty,
        shuffleQuestions: input.shuffleQuestions,
        shuffleOptions: input.shuffleOptions,
        adaptiveMode: input.adaptiveMode,
        totalQuestions: input.totalQuestions,
        version: 1,
        isCurrent: true,
      },
    });

    return this.prisma.assessmentConfig.update({
      where: { id: created.id },
      data: { assessmentGroupId: created.id },
    });
  }

  async createVersion(tenantId: string, assessmentGroupId: string, input: AssessmentConfigInput) {
    const current = await this.prisma.assessmentConfig.findFirst({
      where: { tenantId, assessmentGroupId, isCurrent: true },
    });
    if (!current) {
      throw new NotFoundException('Assessment not found');
    }

    const merged: Record<string, any> = {};
    for (const field of VERSIONED_FIELDS) {
      merged[field] = field in input ? (input as any)[field] : (current as any)[field];
    }

    const [, newVersion] = await this.prisma.$transaction([
      this.prisma.assessmentConfig.update({
        where: { id: current.id },
        data: { isCurrent: false },
      }),
      this.prisma.assessmentConfig.create({
        data: {
          tenantId,
          assessmentGroupId,
          version: current.version + 1,
          isCurrent: true,
          ...merged,
        } as any,
      }),
    ]);

    return newVersion;
  }
}
