import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { PolicyService, EffectivePolicy } from './policy.service';

const ADMIN_ROLES = ['org_admin', 'super_admin'];

@Controller('api/proctoring/policy')
@UseGuards(FirebaseAuthGuard)
export class PolicyController {
  constructor(
    private readonly policy: PolicyService,
    private readonly prisma: PrismaService,
  ) {}

  // Effective (resolved) policy for a config — readable by any authed user so
  // the client knows what to enforce.
  @Get()
  async get(@Request() req: any, @Query('configId') configId?: string) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.policy.getEffective(tenantId, configId ?? null);
    return { success: true, data };
  }

  // Create/update a policy (tenant default when configId omitted). Admin only.
  @Put()
  async upsert(
    @Request() req: any,
    @Body() body: Partial<EffectivePolicy> & { configId?: string | null },
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only org admins can manage proctoring policy');
    }
    const { configId, ...fields } = body;
    const data = await this.policy.upsert(tenantId, configId ?? null, fields);
    return { success: true, data };
  }
}
