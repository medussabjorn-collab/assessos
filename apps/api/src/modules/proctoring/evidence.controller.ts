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

@Controller('api/proctoring/integrity')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.PROCTORING_EVIDENCE_REVIEW)
export class IntegrityController {
  constructor(private readonly chain: IntegrityChainService) {}

  @Get(':sessionId')
  async chainOf(@Request() req: any, @Param('sessionId') sessionId: string) {
    const data = await this.chain.getChain(req.resolvedUser.tenantId, sessionId);
    return { success: true, data };
  }

  @Get(':sessionId/verify')
  async verify(@Request() req: any, @Param('sessionId') sessionId: string) {
    const data = await this.chain.verify(req.resolvedUser.tenantId, sessionId);
    return { success: true, data };
  }
}
