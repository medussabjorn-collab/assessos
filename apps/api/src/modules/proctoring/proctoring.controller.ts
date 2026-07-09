import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { ProctoringService, ProctoringEventInput } from './proctoring.service';

@Controller('api/proctoring')
@UseGuards(FirebaseAuthGuard)
export class ProctoringController {
  constructor(
    private readonly proctoring: ProctoringService,
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

  @Post('event')
  async logEvent(@Request() req: any, @Body() body: ProctoringEventInput) {
    const { tenantId, userId } = await this.resolve(req);
    const data = await this.proctoring.logEvent(tenantId, userId, body);
    return { success: true, data };
  }

  @Get('report/:sessionId')
  async report(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.proctoring.getReport(sessionId, tenantId);
    return { success: true, data };
  }
}
