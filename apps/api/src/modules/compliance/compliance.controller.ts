import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { BiasAuditService } from './bias-audit.service';
import { SelfIdService, SubmitSelfIdInput } from './self-id.service';
import { ExplanationService } from './explanation.service';
import { ReviewRequestService } from './review-request.service';
import { DataExportService } from './data-export.service';
import { BiometricConsentService, GrantConsentInput } from './biometric-consent.service';
import { WebhookDispatchService } from '../webhooks/webhook-dispatch.service';

@Controller('api/compliance')
export class ComplianceController {
  constructor(
    private biasAuditService: BiasAuditService,
    private selfIdService: SelfIdService,
    private explanationService: ExplanationService,
    private reviewRequestService: ReviewRequestService,
    private dataExportService: DataExportService,
    private biometricConsentService: BiometricConsentService,
    private webhookDispatch: WebhookDispatchService,
    private prisma: PrismaService,
  ) {}

  // Aggregate adverse-impact data is sensitive even in suppressed form —
  // restricted to org_admin/super_admin, unlike the rest of the hiring
  // module which any authenticated tenant user can read.
  private async requireOrgAdmin(req: any): Promise<void> {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'org_admin' && user.role !== 'super_admin') {
      throw new ForbiddenException(
        'Only org admins can access bias-audit reports',
      );
    }
  }

  @Get('bias-audit')
  @UseGuards(FirebaseAuthGuard)
  async getBiasAudit(
    @Request() req: any,
    @Query('jobRoleId') jobRoleId?: string,
  ) {
    await this.requireOrgAdmin(req);
    const report = await this.biasAuditService.computeAdverseImpact(jobRoleId);

    const anyFlagged = Object.values(report.dimensions).some((groups) =>
      groups.some((g) => g.flagged),
    );
    if (anyFlagged) {
      const tenantId = req.headers['x-tenant-id'];
      void this.webhookDispatch.dispatch(tenantId, 'bias_audit.alert', {
        jobRoleId: report.jobRoleId,
        generatedAt: report.generatedAt,
      });
    }

    return { success: true, data: report };
  }

  @Post('candidates/:candidateId/self-id')
  @UseGuards(FirebaseAuthGuard)
  async submitSelfId(
    @Param('candidateId') candidateId: string,
    @Body() body: SubmitSelfIdInput,
  ) {
    const record = await this.selfIdService.submit(candidateId, body);
    return { success: true, data: record };
  }

  // GDPR Art. 22 / CPRA — explanation of an automated decision (#17).
  @Get('reports/:reportId/explanation')
  @UseGuards(FirebaseAuthGuard)
  async getReportExplanation(
    @Request() req: any,
    @Param('reportId') reportId: string,
  ) {
    const explanation = await this.explanationService.explainReport(
      reportId,
      req.user.uid,
    );
    return { success: true, data: explanation };
  }

  @Post('reports/:reportId/review-request')
  @UseGuards(FirebaseAuthGuard)
  async requestReview(
    @Request() req: any,
    @Param('reportId') reportId: string,
    @Body() body: { reason?: string },
  ) {
    const reviewRequest = await this.reviewRequestService.requestReview(
      reportId,
      req.user.uid,
      body.reason,
    );
    return { success: true, data: reviewRequest };
  }

  @Get('review-requests')
  @UseGuards(FirebaseAuthGuard)
  async listReviewRequests(@Request() req: any) {
    await this.requireOrgAdmin(req);
    const requests = await this.reviewRequestService.listPending();
    return { success: true, data: requests };
  }

  @Post('review-requests/:requestId/resolve')
  @UseGuards(FirebaseAuthGuard)
  async resolveReviewRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
    @Body() body: { resolutionNote: string },
  ) {
    await this.requireOrgAdmin(req);
    const resolved = await this.reviewRequestService.resolve(
      requestId,
      req.user.uid,
      body.resolutionNote,
    );
    return { success: true, data: resolved };
  }

  // GDPR Art. 20 — data portability (#17).
  @Get('me/data-export')
  @UseGuards(FirebaseAuthGuard)
  async exportMyData(@Request() req: any) {
    const data = await this.dataExportService.exportForUser(req.user.uid);
    return { success: true, data };
  }

  // BIPA / Illinois AI Video Interview Act consent (#18).
  @Post('candidates/:candidateId/biometric-consent')
  @UseGuards(FirebaseAuthGuard)
  async grantBiometricConsent(
    @Param('candidateId') candidateId: string,
    @Body() body: GrantConsentInput,
  ) {
    const record = await this.biometricConsentService.grant(candidateId, body);
    return { success: true, data: record };
  }

  @Post('candidates/:candidateId/biometric-consent/revoke')
  @UseGuards(FirebaseAuthGuard)
  async revokeBiometricConsent(@Param('candidateId') candidateId: string) {
    const record = await this.biometricConsentService.revoke(candidateId);
    return { success: true, data: record };
  }
}
