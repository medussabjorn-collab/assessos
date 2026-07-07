import { Module } from '@nestjs/common';
import { PsychometricController } from './psychometric.controller';
import { PsychometricRegistry } from './psychometric-registry.service';
import { DiscModel } from './models/disc.model';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PsychometricController],
  providers: [PsychometricRegistry, DiscModel, PrismaService],
  exports: [PsychometricRegistry],
})
export class PsychometricModule {}
