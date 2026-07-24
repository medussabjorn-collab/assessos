import { Module } from '@nestjs/common';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { EnvironmentController } from './environment.controller';
import { EnvironmentService } from './environment.service';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { EvidenceController, IntegrityController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { IntegrityChainService } from './integrity-chain.service';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [
    ProctoringController,
    IdentityController,
    EnvironmentController,
    PolicyController,
    EvidenceController,
    IntegrityController,
    IncidentController,
  ],
  providers: [
    ProctoringService,
    IdentityService,
    EnvironmentService,
    PolicyService,
    EvidenceService,
    IntegrityChainService,
    IncidentService,
    PrismaService,
  ],
  exports: [
    ProctoringService,
    IdentityService,
    EnvironmentService,
    PolicyService,
    EvidenceService,
    IntegrityChainService,
    IncidentService,
  ],
})
export class ProctoringModule {}
