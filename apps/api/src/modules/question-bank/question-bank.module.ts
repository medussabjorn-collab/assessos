import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
  ],
  controllers: [QuestionBankController],
  providers: [QuestionBankService, PrismaService],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}
