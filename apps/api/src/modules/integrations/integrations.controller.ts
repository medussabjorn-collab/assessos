import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { IntegrationsService } from './integrations.service';

@Controller('api/integrations')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  private tenantOf(req: any): string {
    return req.headers['x-tenant-id'];
  }

  // Available integrations (static catalog) — any authenticated user.
  @Get('catalog')
  catalog() {
    return { success: true, data: this.integrations.listCatalog() };
  }

  // Catalog annotated with this tenant's connection state.
  @Get()
  async list(@Request() req: any) {
    const data = await this.integrations.listForTenant(this.tenantOf(req));
    return { success: true, data };
  }

  @Post(':name/connect')
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  async connect(
    @Request() req: any,
    @Param('name') name: string,
    @Body() body: { config?: Record<string, unknown> },
  ) {
    const data = await this.integrations.connect(this.tenantOf(req), name, body?.config);
    return { success: true, data };
  }

  @Post(':name/disconnect')
  @RequirePermission(PERMISSIONS.INTEGRATIONS_MANAGE)
  async disconnect(@Request() req: any, @Param('name') name: string) {
    const data = await this.integrations.disconnect(this.tenantOf(req), name);
    return { success: true, data };
  }
}
