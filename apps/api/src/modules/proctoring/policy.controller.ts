import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PolicyService, EffectivePolicy } from './policy.service';

@Controller('api/proctoring/policy')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class PolicyController {
  constructor(private readonly policy: PolicyService) {}

  // Effective (resolved) policy for a config — readable by any authed user so
  // the client knows what to enforce.
  @Get()
  async get(@Request() req: any, @Query('configId') configId?: string) {
    const data = await this.policy.getEffective(req.resolvedUser.tenantId, configId ?? null);
    return { success: true, data };
  }

  // Create/update a policy (tenant default when configId omitted). Admin only.
  @Put()
  @RequirePermission(PERMISSIONS.PROCTORING_POLICY_MANAGE)
  async upsert(
    @Request() req: any,
    @Body() body: Partial<EffectivePolicy> & { configId?: string | null },
  ) {
    const { configId, ...fields } = body;
    const data = await this.policy.upsert(req.resolvedUser.tenantId, configId ?? null, fields);
    return { success: true, data };
  }
}
