import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PrismaService } from '../../database/prisma.service';
import {
  IdentityService,
  ReverifyInput,
  SessionBinding,
  SubmitVerificationInput,
} from './identity.service';

@Controller('api/proctoring/identity')
@UseGuards(FirebaseAuthGuard)
export class IdentityController {
  constructor(
    private readonly identity: IdentityService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolve(req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return { tenantId, userId: user.id };
  }

  // Pre-session: submit verification results (document/face/liveness/OTP).
  @Post('verify')
  async verify(@Request() req: any, @Body() body: SubmitVerificationInput) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.identity.submitVerification(tenantId, userId, body);
    return { success: true, data };
  }

  @Get('status')
  async status(@Request() req: any, @Query('sessionId') sessionId?: string) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.identity.getLatest(tenantId, userId, sessionId);
    return { success: true, data };
  }

  // Gate check the assessment-start flow can consult.
  @Get('session/:sessionId/verified')
  async verified(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    const verified = await this.identity.isVerifiedForSession(tenantId, sessionId);
    return { success: true, data: { verified } };
  }

  // In-session continuous re-verification.
  @Post(':id/reverify')
  async reverify(@Request() req: any, @Param('id') id: string, @Body() body: ReverifyInput) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.identity.reverify(tenantId, userId, id, body);
    return { success: true, data };
  }

  // Session binding (device + IP-hash + biometric-hash).
  @Post('session/:sessionId/bind')
  async bind(@Request() req: any, @Param('sessionId') sessionId: string, @Body() body: SessionBinding) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.identity.bindSession(tenantId, sessionId, body);
    return { success: true, data: { id: data.id, bound: true } };
  }

  @Post('session/:sessionId/check-binding')
  async checkBinding(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: SessionBinding,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.identity.checkBinding(tenantId, sessionId, body);
    return { success: true, data };
  }

  // Admin queue for records the automated pipeline couldn't resolve.
  @Get('pending-review')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async pendingReview(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.identity.listPendingReview(tenantId);
    return { success: true, data };
  }

  @Post(':id/override')
  @UseGuards(PermissionsGuard)
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async override(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { decision: 'verified' | 'failed'; note?: string },
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({ where: { firebaseUid: req.user.uid, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    const data = await this.identity.overrideStatus(tenantId, id, user.id, body.decision, body.note);
    return { success: true, data };
  }
}
