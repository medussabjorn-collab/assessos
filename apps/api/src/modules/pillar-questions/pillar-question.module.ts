import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PillarQuestionController } from './pillar-question.controller';
import { PillarQuestionService } from './pillar-question.service';
import { PillarQuestion, PillarQuestionSchema } from './schemas/pillar-question.schema';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PillarQuestion.name, schema: PillarQuestionSchema }])],
  controllers: [PillarQuestionController],
  // PrismaService is required here (not just PillarQuestionService) because
  // FirebaseAuthGuard's own constructor needs it and AuthModule — though
  // @Global() — only exports [AuthService, FirebaseAuthGuard,
  // PermissionsService, PermissionsGuard], not PrismaService. Every other
  // feature module using FirebaseAuthGuard provides PrismaService locally
  // for the same reason (see question-bank.module.ts, users.module.ts).
  providers: [PillarQuestionService, PrismaService],
  exports: [PillarQuestionService],
})
export class PillarQuestionModule {}
