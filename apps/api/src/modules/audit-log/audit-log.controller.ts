import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService, AuditQuery } from './audit-log.service';

const READ_ROLES = ['org_admin', 'super_admin'];

@Controller('api/audit')
@UseGuards(FirebaseAuthGuard)
export class AuditLogController {
  constructor(
    private readonly audit: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@Request() req: any, @Query() query: AuditQuery) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user || !READ_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only org admins can view audit logs');
    }
    const data = await this.audit.query(tenantId, query);
    return { success: true, ...data };
  }
}
