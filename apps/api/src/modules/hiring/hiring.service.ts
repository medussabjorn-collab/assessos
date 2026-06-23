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
    // Return hiring metrics and pipeline overview
    return {
      openPositions: 5,
      totalCandidates: 24,
      pipelineStages: {
        screening: 8,
        technical: 4,
        culture_fit: 6,
        offer: 2,
        hired: 3,
        rejected: 1,
      },
      avgTimeToHire: '18 days',
      offerAcceptanceRate: 85,
      hiringTeamSize: 3,
    };
  }

  async getJobPositions() {
    // Get all open positions for tenant
    return this.jobRoleService.listJobRoles().map((role) => ({
      id: role.id,
      title: role.title,
      department: role.department,
      description: role.description,
      openPositions: 1,
      candidatesInPipeline: 5,
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
    // Get full candidate profile with scores, notes, feedback
    return {
      id: candidateId,
      name: 'Jane Doe',
      email: 'jane@example.com',
      position: 'Software Engineer',
      stage: 'technical',
      appliedDate: '2024-01-15',
      scores: {
        technicalScore: 4.2,
        cultureFitScore: 3.8,
        overallScore: 4.0,
      },
      assessmentResults: {
        technicalAssessment: {
          problemSolving: 4.5,
          systemDesign: 4.0,
          codeQuality: 4.0,
        },
        leadershipAssessment: {
          collaboration: 4.0,
          innovation: 3.5,
          communication: 3.8,
        },
      },
      strengths: ['Problem solving', 'System design', 'Collaboration'],
      gaps: ['Mentoring experience'],
      interviewFeedback: [],
      notes: [],
      recommendation: 'yes',
      nextSteps: ['Culture fit round', 'Team interviews'],
    };
  }

  async compareTopCandidates(jobRoleId: string, count = 3) {
    // Get top candidates for a position for comparison
    const candidates = await this.candidateService.getCandidatesForRole(
      jobRoleId,
    );

    // Sort by overall score (would calculate from assessments)
    const topCandidates = candidates
      .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
      .slice(0, count);

    return {
      jobRoleId,
      topCandidates: topCandidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        technicalScore: c.scores?.technical || 0,
        cultureFitScore: c.scores?.culture_fit || 0,
        overallScore: c.scores?.overall || 0,
        recommendation: 'yes',
        readyForOffer: (c.scores?.overall ?? 0) >= 4.0,
      })),
    };
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
