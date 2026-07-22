import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { AssessmentConfigService, AssessmentConfigInput } from './assessment-config.service';

@Controller('api/assessment-configs')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.ASSESSMENT_CONFIGS_MANAGE)
export class AssessmentConfigController {
  constructor(private configs: AssessmentConfigService) {}

  @Get()
  async list(@Request() req: any) {
    const configs = await this.configs.listCurrent(req.resolvedUser.tenantId);
    return { success: true, data: configs };
  }

  @Get(':groupId/versions')
  async listVersions(@Request() req: any, @Param('groupId') groupId: string) {
    const versions = await this.configs.listVersions(req.resolvedUser.tenantId, groupId);
    return { success: true, data: versions };
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const config = await this.configs.get(req.resolvedUser.tenantId, id);
    return { success: true, data: config };
  }

  @Post()
  async create(@Request() req: any, @Body() body: AssessmentConfigInput) {
    const config = await this.configs.create(req.resolvedUser.tenantId, body);
    return { success: true, data: config, message: 'Assessment created' };
  }

  @Post(':groupId/versions')
  async createVersion(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body() body: AssessmentConfigInput,
  ) {
    const config = await this.configs.createVersion(req.resolvedUser.tenantId, groupId, body);
    return { success: true, data: config, message: 'New version published' };
  }
}
