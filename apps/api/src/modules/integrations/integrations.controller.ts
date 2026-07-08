import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { IntegrationsService } from './integrations.service';

const ADMIN_ROLES = ['org_admin', 'super_admin'];

@Controller('api/integrations')
@UseGuards(FirebaseAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly prisma: PrismaService,
  ) {}

  private tenantOf(req: any): string {
    return req.headers['x-tenant-id'];
  }

  private async assertAdmin(req: any) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId: this.tenantOf(req) },
    });
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only org admins can manage integrations');
    }
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
  async connect(
    @Request() req: any,
    @Param('name') name: string,
    @Body() body: { config?: Record<string, unknown> },
  ) {
    await this.assertAdmin(req);
    const data = await this.integrations.connect(this.tenantOf(req), name, body?.config);
    return { success: true, data };
  }

  @Post(':name/disconnect')
  async disconnect(@Request() req: any, @Param('name') name: string) {
    await this.assertAdmin(req);
    const data = await this.integrations.disconnect(this.tenantOf(req), name);
    return { success: true, data };
  }
}
