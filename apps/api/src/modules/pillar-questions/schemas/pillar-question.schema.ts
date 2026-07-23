import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PillarQuestionDocument = HydratedDocument<PillarQuestion>;

@Schema({ _id: false })
export class LikertOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 1, max: 5 })
  value: number;
}
const LikertOptionSchema = SchemaFactory.createForClass(LikertOption);

// Self-report Likert items for pillar/dimension assessments (leadership),
// as opposed to the binary correct/incorrect items in question-bank's
// Question schema. dimensionId is admin-defined free text matching whatever
// AssessmentConfig.dimensions[].id an org_admin configured — not a fixed
// enum, so no explicit `type:` decorator quirk here (see question-bank's
// Question.moduleId comment for why that mattered there).
@Schema({ timestamps: true, collection: 'pillar_questions' })
export class PillarQuestion {
  // null/undefined = global shared bank; set = tenant-private item
  @Prop({ index: true })
  tenantId?: string;

  @Prop({ required: true, index: true })
  dimensionId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [LikertOptionSchema], required: true })
  options: LikertOption[];

  @Prop({ default: true })
  isActive: boolean;
}

export const PillarQuestionSchema = SchemaFactory.createForClass(PillarQuestion);

PillarQuestionSchema.index({ dimensionId: 1, isActive: 1 });
PillarQuestionSchema.index({ tenantId: 1, dimensionId: 1, isActive: 1 });
