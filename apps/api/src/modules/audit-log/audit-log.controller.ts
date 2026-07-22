import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { AuditLogService, AuditQuery } from './audit-log.service';

@Controller('api/audit')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.AUDIT_LOG_VIEW)
export class AuditLogController {
  constructor(private readonly audit: AuditLogService) {}

  @Get()
  async list(@Request() req: any, @Query() query: AuditQuery) {
    const data = await this.audit.query(req.resolvedUser.tenantId, query);
    return { success: true, ...data };
  }
}
