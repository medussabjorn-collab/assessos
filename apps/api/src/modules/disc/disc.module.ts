import { Module } from '@nestjs/common';
import { DiscController } from './disc.controller';
import { DiscService } from './disc.service';
import { DiscQuestionsService } from './disc-questions.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [DiscController],
  providers: [DiscService, DiscQuestionsService, PrismaService],
  exports: [DiscService],
})
export class DiscModule {}
