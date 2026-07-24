import { IsEnum, IsObject, IsOptional, IsString, IsBoolean } from 'class-validator';
import { RaterRelationship } from '@prisma/client';

export class SubmitFeedbackDto {
  @IsEnum(RaterRelationship)
  relationship: RaterRelationship;

  // Per-competency ratings, e.g. { "vision": 4, "execution": 3 }
  @IsObject()
  ratings: Record<string, number>;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
