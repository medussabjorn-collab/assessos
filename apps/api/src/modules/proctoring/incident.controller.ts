import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IncidentResolution } from '@prisma/client';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { IncidentService, OpenIncidentInput } from './incident.service';

@Controller('api/proctoring/incidents')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class IncidentController {
  constructor(private readonly incidents: IncidentService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async list(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const data = await this.incidents.list(req.resolvedUser.tenantId, { status, severity, sessionId });
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async get(@Request() req: any, @Param('id') id: string) {
    const data = await this.incidents.get(req.resolvedUser.tenantId, id);
    return { success: true, data };
  }

  @Post()
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async open(@Request() req: any, @Body() body: OpenIncidentInput) {
    const data = await this.incidents.open(req.resolvedUser.tenantId, {
      ...body,
      openedBy: req.resolvedUser.id,
    });
    return { success: true, data };
  }

  @Post(':id/assign')
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async assign(@Request() req: any, @Param('id') id: string, @Body() body: { assignedTo: string }) {
    const data = await this.incidents.assign(
      req.resolvedUser.tenantId,
      id,
      req.resolvedUser.id,
      body.assignedTo,
    );
    return { success: true, data };
  }

  @Post(':id/review')
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async review(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { resolution: IncidentResolution; note?: string; dismiss?: boolean },
  ) {
    const data = await this.incidents.review(req.resolvedUser.tenantId, id, req.resolvedUser.id, body);
    return { success: true, data };
  }

  // Appeal request — the subject (or their advocate); any authenticated user,
  // no specific permission required.
  @Post(':id/appeal')
  async appeal(@Request() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    const data = await this.incidents.requestAppeal(
      req.resolvedUser.tenantId,
      id,
      req.resolvedUser.id,
      body.reason,
    );
    return { success: true, data };
  }

  @Post(':id/appeal/resolve')
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_APPEALS_MANAGE)
  async resolveAppeal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { outcome: 'upheld' | 'overturned'; note?: string },
  ) {
    const data = await this.incidents.resolveAppeal(
      req.resolvedUser.tenantId,
      id,
      req.resolvedUser.id,
      body.outcome,
      body.note,
    );
    return { success: true, data };
  }

  @Get(':id/evidence-export')
  @RequirePermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW)
  async evidenceExport(@Request() req: any, @Param('id') id: string) {
    const data = await this.incidents.evidenceExport(req.resolvedUser.tenantId, id);
    return { success: true, data };
  }
}
