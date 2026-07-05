import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JobRoleService } from './job-role.service';
import { CandidateService } from './candidate.service';
import { HiringScoreService } from './hiring-score.service';

@Injectable({ scope: Scope.REQUEST })
export class HiringService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private jobRoleService: JobRoleService,
    private candidateService: CandidateService,
    private hiringScoreService: HiringScoreService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getHiringDashboard() {
    const [pipelineStages, hiredCandidates, teamSize] = await Promise.all([
      this.candidateService.getStageCounts(),
      this.prisma.candidate.findMany({
        where: { tenantId: this.tenantId, stage: 'hired' },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.user.count({ where: { tenantId: this.tenantId } }),
    ]);

    const totalCandidates = Object.values(pipelineStages).reduce(
      (sum, n) => sum + n,
      0,
    );

    // Time-to-hire: creation → last update on hired candidates.
    const avgDays = hiredCandidates.length
      ? Math.round(
          hiredCandidates.reduce(
            (sum, c) =>
              sum +
              (c.updatedAt.getTime() - c.createdAt.getTime()) / 86_400_000,
            0,
          ) / hiredCandidates.length,
        )
      : null;

    const offersExtended = pipelineStages.offer + pipelineStages.hired;
    const offerAcceptanceRate = offersExtended
      ? Math.round((pipelineStages.hired / offersExtended) * 100)
      : null;

    return {
      openPositions: this.jobRoleService.listJobRoles().length,
      totalCandidates,
      pipelineStages,
      avgTimeToHire: avgDays != null ? `${avgDays} days` : '—',
      offerAcceptanceRate: offerAcceptanceRate ?? 0,
      hiringTeamSize: teamSize,
    };
  }

  async getJobPositions() {
    const roleCounts = await this.prisma.candidate.groupBy({
      by: ['jobRoleId'],
      where: { tenantId: this.tenantId },
      _count: { _all: true },
    });
    const countByRole = new Map(
      roleCounts.map((r) => [r.jobRoleId, r._count._all]),
    );

    return this.jobRoleService.listJobRoles().map((role) => ({
      id: role.id,
      title: role.title,
      department: role.department,
      description: role.description,
      openPositions: 1,
      candidatesInPipeline: countByRole.get(role.id) ?? 0,
    }));
  }

  async getCandidatePipeline(jobRoleId: string) {
    // Get candidates grouped by pipeline stage
    const candidates = await this.candidateService.getCandidatesForRole(
      jobRoleId,
    );

    return {
      jobRoleId,
      screening: candidates.filter((c) => c.stage === 'screening'),
      technical: candidates.filter((c) => c.stage === 'technical'),
      culture_fit: candidates.filter((c) => c.stage === 'culture_fit'),
      offer: candidates.filter((c) => c.stage === 'offer'),
      hired: candidates.filter((c) => c.stage === 'hired'),
      rejected: candidates.filter((c) => c.stage === 'rejected'),
    };
  }

  async getCandidateProfile(candidateId: string) {
    const c = await this.candidateService.getCandidate(candidateId);
    const overall = this.overallScore(c.technicalScore, c.cultureFitScore);

    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      position: c.roleTitle,
      stage: c.stage,
      appliedDate: c.createdAt.toISOString().slice(0, 10),
      scores: {
        technicalScore: c.technicalScore ?? 0,
        cultureFitScore: c.cultureFitScore ?? 0,
        overallScore: overall ?? 0,
      },
      phone: c.phone,
      linkedinUrl: c.linkedinUrl,
      resumeUrl: c.resumeUrl,
      assessmentSessionId: c.assessmentSessionId,
      notes: c.notes ? [c.notes] : [],
      rejectionReason: c.rejectionReason,
    };
  }

  async compareTopCandidates(jobRoleId: string, count = 3) {
    const candidates = await this.candidateService.getCandidatesForRole(
      jobRoleId,
    );

    const topCandidates = candidates
      .map((c) => ({
        ...c,
        overall: this.overallScore(c.technicalScore, c.cultureFitScore) ?? 0,
      }))
      .sort((a, b) => b.overall - a.overall)
      .slice(0, count);

    return {
      jobRoleId,
      topCandidates: topCandidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        technicalScore: c.technicalScore ?? 0,
        cultureFitScore: c.cultureFitScore ?? 0,
        overallScore: c.overall,
        readyForOffer: c.overall >= 4.0,
      })),
    };
  }

  private overallScore(
    technical: number | null,
    cultureFit: number | null,
  ): number | null {
    if (technical == null || cultureFit == null) return null;
    return Math.round(((technical + cultureFit) / 2) * 10) / 10;
  }

  async getHiringAnalytics() {
    // Return hiring funnel and metrics
    return {
      totalApplicants: 150,
      screenedCount: 50,
      technicalPassCount: 20,
      cultureFitPassCount: 10,
      offerCount: 5,
      hiredCount: 3,
      conversionRate: 2.0,
      avgTimeToScreening: 2,
      avgTimeTechnical: 7,
      avgTimeCultureFit: 5,
      avgTimeToOffer: 14,
      topCandidatesSources: [
        { source: 'LinkedIn', count: 35, hired: 1 },
        { source: 'Referral', count: 20, hired: 2 },
        { source: 'Careers Page', count: 25, hired: 0 },
      ],
    };
  }

  async initiateBackgroundCheck(candidateId: string) {
    // Trigger background check for approved candidate
    return {
      checkId: `bgc_${candidateId}_${Date.now()}`,
      status: 'initiated',
      estimatedDays: 3,
    };
  }

  async sendOfferLetter(
    candidateId: string,
    offerDetails: {
      role: string;
      salary: string;
      startDate: string;
    },
  ) {
    // Generate and send offer letter
    return {
      offerId: `offer_${candidateId}_${Date.now()}`,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
    };
  }
}
