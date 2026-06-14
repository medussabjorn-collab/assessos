import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { QuestionLibraryService } from './question-library.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { BadgeService } from './badge.service';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PracticeController],
  providers: [
    PracticeService,
    QuestionLibraryService,
    SpacedRepetitionService,
    BadgeService,
    PerformanceService,
    PrismaService,
  ],
  exports: [
    PracticeService,
    QuestionLibraryService,
    SpacedRepetitionService,
    BadgeService,
    PerformanceService,
  ],
})
export class PracticeModule {}
