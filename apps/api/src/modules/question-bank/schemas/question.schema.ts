import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const QUESTION_MODULE_IDS = [
  'technical',
  'attitude',
  'behavioral',
  'psychometric',
  'communication',
] as const;
export type QuestionModuleId = (typeof QUESTION_MODULE_IDS)[number];

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ _id: false })
export class QuestionOption {
  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  text: string;
}
const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

// Ported from leadership-assessment (src/models/mongo/Question.ts). The 3PL-IRT
// item parameters (difficulty/discrimination/guessing) feed the adaptive
// testing engine. Added `tenantId` for assessos multi-tenancy: null = a shared
// / global item, a value = tenant-private. Kept in Mongo (not Prisma) because
// the item bank is high-volume, schema-flexible content.
@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  // null/undefined = global shared bank; set = tenant-private item
  @Prop({ index: true })
  tenantId?: string;

  // `type: String` is required here even though `enum` is set — the field's
  // TS type is a string-literal union, which has no concrete runtime
  // constructor, so @nestjs/mongoose can't infer a Mongoose type from
  // reflected design:type metadata alone (throws "Cannot determine a type
  // for the ... field" the first time this class is evaluated outside the
  // exact bundler context that happened to mask it).
  @Prop({ type: String, required: true, enum: QUESTION_MODULE_IDS })
  moduleId: QuestionModuleId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [QuestionOptionSchema], required: true })
  options: QuestionOption[];

  @Prop({ required: true })
  correctIndex: number;

  @Prop()
  explanation?: string;

  @Prop({ required: true, min: -3, max: 3, default: 0 })
  difficulty: number;

  @Prop({ required: true, min: 0.5, max: 3, default: 1 })
  discrimination: number;

  @Prop({ required: true, min: 0, max: 0.35, default: 0.25 })
  guessing: number;

  @Prop()
  subTopic?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  language?: string;

  @Prop()
  codeSnippet?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ moduleId: 1, isActive: 1 });
QuestionSchema.index({ tenantId: 1, moduleId: 1, isActive: 1 });
QuestionSchema.index({ moduleId: 1, subTopic: 1 });
QuestionSchema.index({ difficulty: 1 });
