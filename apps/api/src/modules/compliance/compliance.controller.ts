import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
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
  ) {}

  // Aggregate adverse-impact data is sensitive even in suppressed form —
  // restricted to whoever holds compliance.bias_audit.view (org_admin +
  // super_admin by default), unlike the rest of the hiring module which any
  // authenticated tenant user can read.
  @Get('bias-audit')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.COMPLIANCE_BIAS_AUDIT_VIEW)
  async getBiasAudit(
    @Request() req: any,
    @Query('jobRoleId') jobRoleId?: string,
  ) {
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
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.COMPLIANCE_REVIEW_REQUESTS_MANAGE)
  async listReviewRequests() {
    const requests = await this.reviewRequestService.listPending();
    return { success: true, data: requests };
  }

  @Post('review-requests/:requestId/resolve')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.COMPLIANCE_REVIEW_REQUESTS_MANAGE)
  async resolveReviewRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
    @Body() body: { resolutionNote: string },
  ) {
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
