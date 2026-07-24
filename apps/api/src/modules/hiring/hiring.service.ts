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
    const [candidates, audits] = await Promise.all([
      this.prisma.candidate.findMany({
        where: { tenantId: this.tenantId },
        select: { id: true, stage: true, source: true, createdAt: true },
      }),
      this.prisma.hiringDecisionAudit.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { decidedAt: 'asc' },
        select: { candidateId: true, fromStage: true, toStage: true, decidedAt: true },
      }),
    ]);

    const totalApplicants = candidates.length;
    const hiredCount = candidates.filter((c) => c.stage === 'hired').length;

    // Distinct candidates who ever advanced FROM a given stage to a
    // non-rejected stage — reflects "passed this stage at some point," not
    // current position, since a candidate who's now hired also passed
    // technical/culture_fit earlier.
    const advancedFrom = (fromStage: string) =>
      new Set(
        audits
          .filter((a) => a.fromStage === fromStage && a.toStage !== 'rejected')
          .map((a) => a.candidateId),
      ).size;

    const screenedCount = advancedFrom('screening');
    const technicalPassCount = advancedFrom('technical');
    const cultureFitPassCount = advancedFrom('culture_fit');
    const offerCount = new Set(
      audits.filter((a) => a.toStage === 'offer' || a.toStage === 'hired').map((a) => a.candidateId),
    ).size;

    const conversionRate =
      totalApplicants > 0 ? Math.round((hiredCount / totalApplicants) * 1000) / 10 : 0;

    // Average days between consecutive stage-leaving transitions, per
    // candidate, then averaged across candidates who made that transition.
    // avgTimeToScreening uses Candidate.createdAt as the start point (no
    // "applied" audit row exists — screening is the initial stage).
    const byCandidate = new Map<string, typeof audits>();
    for (const a of audits) {
      const list = byCandidate.get(a.candidateId) ?? [];
      list.push(a);
      byCandidate.set(a.candidateId, list);
    }
    const candidateCreatedAt = new Map(candidates.map((c) => [c.id, c.createdAt]));

    const avgDaysFor = (fromStage: string): number | null => {
      const durations: number[] = [];
      for (const [candidateId, transitions] of byCandidate) {
        const transition = transitions.find((t) => t.fromStage === fromStage);
        if (!transition) continue;
        const start =
          fromStage === 'screening'
            ? candidateCreatedAt.get(candidateId)
            : transitions
                .filter((t) => t.decidedAt < transition.decidedAt)
                .sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime())[0]?.decidedAt;
        if (!start) continue;
        durations.push((transition.decidedAt.getTime() - start.getTime()) / 86_400_000);
      }
      if (durations.length === 0) return null;
      return Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10;
    };

    const sourceGroups = new Map<string, { count: number; hired: number }>();
    for (const c of candidates) {
      const key = c.source ?? 'unspecified';
      const entry = sourceGroups.get(key) ?? { count: 0, hired: 0 };
      entry.count += 1;
      if (c.stage === 'hired') entry.hired += 1;
      sourceGroups.set(key, entry);
    }
    const topCandidatesSources = [...sourceGroups.entries()]
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.count - a.count);

    return {
      totalApplicants,
      screenedCount,
      technicalPassCount,
      cultureFitPassCount,
      offerCount,
      hiredCount,
      conversionRate,
      avgTimeToScreening: avgDaysFor('screening'),
      avgTimeTechnical: avgDaysFor('technical'),
      avgTimeCultureFit: avgDaysFor('culture_fit'),
      avgTimeToOffer: avgDaysFor('offer'),
      topCandidatesSources,
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
