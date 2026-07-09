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
import { EvidenceService, RecordEvidenceInput } from './evidence.service';
import { IntegrityChainService } from './integrity-chain.service';

@Controller('api/proctoring/evidence')
@UseGuards(FirebaseAuthGuard)
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Post()
  async record(@Request() req: any, @Body() body: RecordEvidenceInput) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.evidence.record(tenantId, body);
    return { success: true, data };
  }

  @Get(':sessionId')
  async list(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    const data = await this.evidence.list(tenantId, sessionId);
    return { success: true, data };
  }
}

const REVIEW_ROLES = ['org_admin', 'super_admin', 'manager'];

@Controller('api/proctoring/integrity')
@UseGuards(FirebaseAuthGuard)
export class IntegrityController {
  constructor(
    private readonly chain: IntegrityChainService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertReviewer(req: any, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!user || !REVIEW_ROLES.includes(user.role)) {
      throw new NotFoundException('User not found');
    }
  }

  @Get(':sessionId')
  async chainOf(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    await this.assertReviewer(req, tenantId);
    const data = await this.chain.getChain(tenantId, sessionId);
    return { success: true, data };
  }

  @Get(':sessionId/verify')
  async verify(@Request() req: any, @Param('sessionId') sessionId: string) {
    const tenantId = req.headers['x-tenant-id'];
    await this.assertReviewer(req, tenantId);
    const data = await this.chain.verify(tenantId, sessionId);
    return { success: true, data };
  }
}
