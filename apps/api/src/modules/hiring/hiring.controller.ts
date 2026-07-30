import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { toCsv } from '../../common/csv.util';
import { HiringService } from './hiring.service';
import { CandidateService } from './candidate.service';
import { JobMatchService } from './job-match.service';

@Controller('api/hiring')
export class HiringController {
  constructor(
    private hiringService: HiringService,
    private candidateService: CandidateService,
    private jobMatchService: JobMatchService,
  ) {}

  // Serves #24 (pre-assessment job matching) and #25 (post-assessment
  // "not selected, suggest better fit"). No resume parsing — caller
  // supplies the skills list however it extracted them.
  @Post('job-matches')
  @UseGuards(FirebaseAuthGuard)
  matchJobs(@Body() body: { skills: string[] }) {
    const matches = this.jobMatchService.matchSkillsToRoles(body.skills ?? []);
    return { success: true, data: matches };
  }

  // Same authorization as GET /candidates (FirebaseAuthGuard only) — no new
  // gate beyond what that route already has.
  @Get('candidates/export')
  @UseGuards(FirebaseAuthGuard)
  async exportCandidates(@Res() res: Response) {
    const candidates = await this.candidateService.getCandidatesForTenant();
    const csv = toCsv(
      candidates.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        roleTitle: c.roleTitle,
        stage: c.stage,
        country: c.country,
        source: c.source,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      [
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'roleTitle', header: 'Role' },
        { key: 'stage', header: 'Stage' },
        { key: 'country', header: 'Country' },
        { key: 'source', header: 'Source' },
        { key: 'createdAt', header: 'Applied At' },
        { key: 'updatedAt', header: 'Last Updated' },
      ],
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
    res.send(csv);
  }

  @Get('candidates')
  @UseGuards(FirebaseAuthGuard)
  async listCandidates() {
    const candidates = await this.candidateService.getCandidatesForTenant();
    return {
      success: true,
      data: candidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        role: c.roleTitle,
        stage: c.stage,
        technicalScore: c.technicalScore ?? 0,
        cultureFitScore: c.cultureFitScore ?? 0,
      })),
    };
  }

  @Post('candidates')
  @UseGuards(FirebaseAuthGuard)
  async createCandidate(
    @Request() req: any,
    @Body()
    body: {
      jobRoleId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      linkedinUrl?: string;
      resumeUrl?: string;
      country?: string;
      usState?: string;
      source?: string;
    },
  ) {
    const { jobRoleId, ...candidateData } = body;
    const candidate = await this.candidateService.createCandidate(
      jobRoleId,
      candidateData,
      req.user.uid,
    );
    return {
      success: true,
      data: candidate,
    };
  }

  @Post('candidates/:candidateId/stage')
  @UseGuards(FirebaseAuthGuard)
  async updateCandidateStage(
    @Param('candidateId') candidateId: string,
    @Body() body: { stage: string; notes?: string },
  ) {
    const candidate = await this.candidateService.updateCandidateStage(
      candidateId,
      body.stage,
      body.notes,
    );
    return {
      success: true,
      data: candidate,
    };
  }

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  async getDashboard() {
    const dashboard = await this.hiringService.getHiringDashboard();
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('positions')
  @UseGuards(FirebaseAuthGuard)
  async getPositions() {
    const positions = await this.hiringService.getJobPositions();
    return {
      success: true,
      data: positions,
    };
  }

  @Get('positions/:jobRoleId/pipeline')
  @UseGuards(FirebaseAuthGuard)
  async getPipeline(@Param('jobRoleId') jobRoleId: string) {
    const pipeline = await this.hiringService.getCandidatePipeline(jobRoleId);
    return {
      success: true,
      data: pipeline,
    };
  }

  @Get('candidates/:candidateId')
  @UseGuards(FirebaseAuthGuard)
  async getCandidateProfile(@Param('candidateId') candidateId: string) {
    const profile = await this.hiringService.getCandidateProfile(candidateId);
    return {
      success: true,
      data: profile,
    };
  }

  @Get('positions/:jobRoleId/top-candidates')
  @UseGuards(FirebaseAuthGuard)
  async getTopCandidates(
    @Param('jobRoleId') jobRoleId: string,
    @Request() req: any,
  ) {
    const comparison = await this.hiringService.compareTopCandidates(
      jobRoleId,
      3,
    );
    return {
      success: true,
      data: comparison,
    };
  }

  @Get('analytics')
  @UseGuards(FirebaseAuthGuard)
  async getAnalytics() {
    const analytics = await this.hiringService.getHiringAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }

  @Post('candidates/:candidateId/background-check')
  @UseGuards(FirebaseAuthGuard)
  async initiateBackgroundCheck(@Param('candidateId') candidateId: string) {
    const result = await this.hiringService.initiateBackgroundCheck(candidateId);
    return {
      success: true,
      data: result,
      message: 'Background check initiated',
    };
  }

  @Post('candidates/:candidateId/send-offer')
  @UseGuards(FirebaseAuthGuard)
  async sendOffer(
    @Param('candidateId') candidateId: string,
    @Body()
    body: {
      role: string;
      salary: string;
      startDate: string;
    },
  ) {
    const result = await this.hiringService.sendOfferLetter(candidateId, body);
    return {
      success: true,
      data: result,
      message: 'Offer letter sent to candidate',
    };
  }
}
