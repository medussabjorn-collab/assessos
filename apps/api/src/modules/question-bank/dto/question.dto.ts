import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QUESTION_MODULE_IDS, QuestionModuleId } from '../schemas/question.schema';

export class QuestionOptionDto {
  @IsInt()
  index: number;

  @IsString()
  @MinLength(1)
  text: string;
}

export class CreateQuestionDto {
  @IsIn(QUESTION_MODULE_IDS as unknown as string[])
  moduleId: QuestionModuleId;

  @IsString()
  @MinLength(10)
  text: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @IsInt()
  @Min(0)
  correctIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  @Min(-3)
  @Max(3)
  difficulty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  discrimination?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.35)
  guessing?: number;

  @IsOptional()
  @IsString()
  subTopic?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  codeSnippet?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Partial for PATCH/PUT — every field optional.
export class UpdateQuestionDto {
  @IsOptional() @IsIn(QUESTION_MODULE_IDS as unknown as string[]) moduleId?: QuestionModuleId;
  @IsOptional() @IsString() @MinLength(10) text?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionOptionDto) options?: QuestionOptionDto[];
  @IsOptional() @IsInt() @Min(0) correctIndex?: number;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsNumber() @Min(-3) @Max(3) difficulty?: number;
  @IsOptional() @IsNumber() @Min(0.5) @Max(3) discrimination?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(0.35) guessing?: number;
  @IsOptional() @IsString() subTopic?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() codeSnippet?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
