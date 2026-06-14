import { IsArray, IsObject, IsNotEmpty } from 'class-validator';

export class SubmitAnswersDto {
  @IsArray()
  @IsNotEmpty()
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    timeTakenSec: number;
  }>;

  @IsObject()
  metadata: {
    totalTimeTakenSec: number;
    answeredCount: number;
    skippedCount: number;
  };
}
