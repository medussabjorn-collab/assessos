import { Module } from '@nestjs/common';
import { RaterFeedbackController } from './rater-feedback.controller';
import { RaterFeedbackService } from './rater-feedback.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RaterFeedbackController],
  providers: [RaterFeedbackService, PrismaService],
  exports: [RaterFeedbackService],
})
export class RaterFeedbackModule {}
