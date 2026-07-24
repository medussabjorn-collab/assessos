import { Module } from '@nestjs/common';
import { PsychometricController } from './psychometric.controller';
import { PsychometricRegistry } from './psychometric-registry.service';
import { DiscModel } from './models/disc.model';
import { BigFiveModel } from './models/big-five.model';
import { CompositeProfileService } from './composite-profile.service';
import { TeamDynamicsService } from './team-dynamics.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PsychometricController],
  providers: [
    PsychometricRegistry,
    DiscModel,
    BigFiveModel,
    CompositeProfileService,
    TeamDynamicsService,
    PrismaService,
  ],
  exports: [PsychometricRegistry, CompositeProfileService, TeamDynamicsService],
})
export class PsychometricModule {}
