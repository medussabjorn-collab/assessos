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
import { PrismaService } from '../../database/prisma.service';
import { EnvironmentService, SubmitScanInput } from './environment.service';

@Controller('api/proctoring/environment')
@UseGuards(FirebaseAuthGuard)
export class EnvironmentController {
  constructor(
    private readonly environment: EnvironmentService,
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

  @Post('scan')
  async scan(@Request() req: any, @Body() body: SubmitScanInput) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.environment.submitScan(tenantId, userId, body);
    return { success: true, data };
  }

  @Get('status')
  async status(@Request() req: any, @Query('sessionId') sessionId?: string) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.environment.getLatest(tenantId, userId, sessionId);
    return { success: true, data };
  }

  @Get('session/:sessionId/clear')
  async clear(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    const clear = await this.environment.isClear(tenantId, sessionId);
    return { success: true, data: { clear } };
  }
}
