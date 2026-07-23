import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SubmitAdaptiveAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsInt()
  @Min(0)
  selectedIndex: number;

  @IsNumber()
  @Min(0)
  timeTakenSec: number;
}
