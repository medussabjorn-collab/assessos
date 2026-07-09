import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IncidentResolution } from '@prisma/client';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { IncidentService, OpenIncidentInput } from './incident.service';

const REVIEW_ROLES = ['org_admin', 'super_admin', 'manager'];
const ADMIN_ROLES = ['org_admin', 'super_admin'];

@Controller('api/proctoring/incidents')
@UseGuards(FirebaseAuthGuard)
export class IncidentController {
  constructor(
    private readonly incidents: IncidentService,
    private readonly prisma: PrismaService,
  ) {}

  private async user(req: any) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return { tenantId, user };
  }

  private assertRole(role: string, allowed: string[], msg: string) {
    if (!allowed.includes(role)) throw new ForbiddenException(msg);
  }

  @Get()
  async list(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can view incidents');
    const data = await this.incidents.list(tenantId, { status, severity, sessionId });
    return { success: true, data };
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can view incidents');
    const data = await this.incidents.get(tenantId, id);
    return { success: true, data };
  }

  @Post()
  async open(@Request() req: any, @Body() body: OpenIncidentInput) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can open incidents');
    const data = await this.incidents.open(tenantId, { ...body, openedBy: user.id });
    return { success: true, data };
  }

  @Post(':id/assign')
  async assign(@Request() req: any, @Param('id') id: string, @Body() body: { assignedTo: string }) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can assign incidents');
    const data = await this.incidents.assign(tenantId, id, user.id, body.assignedTo);
    return { success: true, data };
  }

  @Post(':id/review')
  async review(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { resolution: IncidentResolution; note?: string; dismiss?: boolean },
  ) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can review incidents');
    const data = await this.incidents.review(tenantId, id, user.id, body);
    return { success: true, data };
  }

  // Appeal request — the subject (or their advocate); any authenticated user.
  @Post(':id/appeal')
  async appeal(@Request() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    const { tenantId, user } = await this.user(req);
    const data = await this.incidents.requestAppeal(tenantId, id, user.id, body.reason);
    return { success: true, data };
  }

  @Post(':id/appeal/resolve')
  async resolveAppeal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { outcome: 'upheld' | 'overturned'; note?: string },
  ) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, ADMIN_ROLES, 'Only admins can resolve appeals');
    const data = await this.incidents.resolveAppeal(tenantId, id, user.id, body.outcome, body.note);
    return { success: true, data };
  }

  @Get(':id/evidence-export')
  async evidenceExport(@Request() req: any, @Param('id') id: string) {
    const { tenantId, user } = await this.user(req);
    this.assertRole(user.role, REVIEW_ROLES, 'Only proctors/admins can export evidence');
    const data = await this.incidents.evidenceExport(tenantId, id);
    return { success: true, data };
  }
}
