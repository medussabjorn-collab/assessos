import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Candidate, PipelineStage } from '@prisma/client';
import { JobRoleService } from './job-role.service';

export type CandidateRecord = Candidate;

const STAGES: PipelineStage[] = [
  'screening',
  'technical',
  'culture_fit',
  'offer',
  'hired',
  'rejected',
];

@Injectable({ scope: Scope.REQUEST })
export class CandidateService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private jobRoleService: JobRoleService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async createCandidate(
    jobRoleId: string,
    candidateData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      linkedinUrl?: string;
      resumeUrl?: string;
    },
    createdBy: string,
  ): Promise<CandidateRecord> {
    const role = this.jobRoleService.getJobRole(jobRoleId);

    return this.prisma.candidate.create({
      data: {
        tenantId: this.tenantId,
        jobRoleId,
        roleTitle: role?.title ?? jobRoleId,
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        linkedinUrl: candidateData.linkedinUrl,
        resumeUrl: candidateData.resumeUrl,
        createdBy,
      },
    });
  }

  async startCandidateAssessment(
    candidateId: string,
    jobRoleId: string,
    assessmentType: 'technical' | 'culture_fit',
  ): Promise<{ sessionId: string }> {
    const sessionId = `hiring_${candidateId}_${assessmentType}_${Date.now()}`;

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { assessmentSessionId: sessionId },
    });

    return { sessionId };
  }

  async updateCandidateStage(
    candidateId: string,
    newStage: string,
    notes?: string,
  ): Promise<CandidateRecord> {
    if (!STAGES.includes(newStage as PipelineStage)) {
      throw new NotFoundException(`Unknown pipeline stage: ${newStage}`);
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        stage: newStage as PipelineStage,
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  }

  async getCandidate(candidateId: string): Promise<CandidateRecord> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async getCandidatesForRole(jobRoleId: string): Promise<CandidateRecord[]> {
    return this.prisma.candidate.findMany({
      where: { tenantId: this.tenantId, jobRoleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCandidatesForTenant(): Promise<CandidateRecord[]> {
    return this.prisma.candidate.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStageCounts(): Promise<Record<PipelineStage, number>> {
    const groups = await this.prisma.candidate.groupBy({
      by: ['stage'],
      where: { tenantId: this.tenantId },
      _count: { _all: true },
    });

    const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
      PipelineStage,
      number
    >;
    for (const g of groups) {
      counts[g.stage] = g._count._all;
    }
    return counts;
  }

  async compareCandidates(candidateIds: string[]): Promise<any> {
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: candidateIds }, tenantId: this.tenantId },
    });

    return {
      candidates: candidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        roleTitle: c.roleTitle,
        stage: c.stage,
        technicalScore: c.technicalScore ?? 0,
        cultureFitScore: c.cultureFitScore ?? 0,
        overallScore:
          c.technicalScore != null && c.cultureFitScore != null
            ? Math.round(((c.technicalScore + c.cultureFitScore) / 2) * 10) / 10
            : 0,
      })),
    };
  }

  async rejectCandidate(
    candidateId: string,
    reason: string,
    notes?: string,
  ): Promise<CandidateRecord> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        stage: 'rejected',
        rejectionReason: reason,
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  }

  async makeOffer(
    candidateId: string,
    _offerDetails: {
      role: string;
      salary: string;
      startDate: string;
      benefits: string[];
    },
  ): Promise<CandidateRecord> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: this.tenantId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Offer letter generation / e-signature is a later phase — for now the
    // pipeline stage transition is the source of truth.
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: 'offer' },
    });
  }
}
