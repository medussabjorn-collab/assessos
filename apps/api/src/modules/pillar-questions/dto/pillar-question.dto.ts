import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LikertOptionDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  @MinLength(1)
  text: string;

  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}

export class CreatePillarQuestionDto {
  @IsString()
  @MinLength(1)
  dimensionId: string;

  @IsString()
  @MinLength(10)
  text: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LikertOptionDto)
  options: LikertOptionDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePillarQuestionDto {
  @IsOptional() @IsString() @MinLength(1) dimensionId?: string;
  @IsOptional() @IsString() @MinLength(10) text?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LikertOptionDto) options?: LikertOptionDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BulkImportPillarQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePillarQuestionDto)
  questions: CreatePillarQuestionDto[];
}
