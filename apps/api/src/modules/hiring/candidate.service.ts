import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CandidateRecord {
  id: string;
  tenantId: string;
  jobRoleId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  stage: 'screening' | 'technical' | 'culture_fit' | 'offer' | 'hired' | 'rejected';
  assessmentSessionId?: string;
  scores?: Record<string, number>;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

@Injectable({ scope: Scope.REQUEST })
export class CandidateService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
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
    // Create candidate record (stored in AiReport with custom metadata for now)
    // TODO: Create proper Candidate table in Prisma schema for Phase 8

    return {
      id: `candidate_${Date.now()}`,
      tenantId: this.tenantId,
      jobRoleId,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      email: candidateData.email,
      phone: candidateData.phone,
      linkedinUrl: candidateData.linkedinUrl,
      resumeUrl: candidateData.resumeUrl,
      stage: 'screening',
      createdAt: new Date(),
      createdBy,
    };
  }

  async startCandidateAssessment(
    candidateId: string,
    jobRoleId: string,
    assessmentType: 'technical' | 'culture_fit',
  ): Promise<{ sessionId: string }> {
    // Start assessment session for candidate
    // Links to existing assessment infrastructure

    const sessionId = `hiring_${candidateId}_${assessmentType}_${Date.now()}`;

    return {
      sessionId,
    };
  }

  async updateCandidateStage(
    candidateId: string,
    newStage: string,
    notes?: string,
  ): Promise<CandidateRecord> {
    // Update candidate pipeline stage
    // Moves through: screening → technical → culture_fit → offer → hired/rejected

    return {
      id: candidateId,
      tenantId: this.tenantId,
      jobRoleId: '',
      firstName: '',
      lastName: '',
      email: '',
      stage: newStage as any,
      notes,
      createdAt: new Date(),
      createdBy: '',
    };
  }

  async getCandidatesForRole(jobRoleId: string): Promise<CandidateRecord[]> {
    // Get all candidates for a specific job role
    // Grouped by stage for pipeline view

    return [];
  }

  async getCandidatesForTenant(): Promise<CandidateRecord[]> {
    // Get all candidates for the tenant
    // Across all job roles and stages

    return [];
  }

  async compareCandidates(candidateIds: string[]): Promise<any> {
    // Compare multiple candidates side-by-side
    // Shows scores, skills, feedback, interview notes

    return {
      candidates: candidateIds.map((id) => ({
        id,
        technicalScore: 0,
        cultureFitScore: 0,
        overallScore: 0,
        strengths: [],
        gaps: [],
        recommendations: '',
      })),
    };
  }

  async rejectCandidate(
    candidateId: string,
    reason: string,
    notes?: string,
  ): Promise<void> {
    // Reject candidate and close hiring loop
    // Send notification email
    // Archive from active pipeline
  }

  async makeOffer(
    candidateId: string,
    offerDetails: {
      role: string;
      salary: string;
      startDate: string;
      benefits: string[];
    },
  ): Promise<void> {
    // Generate offer letter
    // Move to offer stage
    // Track offer status (pending, accepted, declined)
  }
}
