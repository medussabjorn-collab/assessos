import mongoose, { Schema, Document } from 'mongoose';
import { IQuestion, AssessmentModuleId } from '../../types';

export interface QuestionDocument extends Omit<IQuestion, '_id'>, Document {}

const OptionSchema = new Schema({
  index: { type: Number, required: true },
  text:  { type: String, required: true },
}, { _id: false });

const QuestionSchema = new Schema<QuestionDocument>(
  {
    moduleId:       { type: String, required: true, enum: ['technical','attitude','behavioral','psychometric','communication'] as AssessmentModuleId[] },
    text:           { type: String, required: true, index: 'text' },
    options:        { type: [OptionSchema], required: true, validate: [(v: unknown[]) => v.length >= 2, 'Min 2 options'] },
    correctIndex:   { type: Number, required: true },
    explanation:    { type: String },
    difficulty:     { type: Number, required: true, min: -3, max: 3, default: 0 },
    discrimination: { type: Number, required: true, min: 0.5, max: 3, default: 1 },
    guessing:       { type: Number, required: true, min: 0, max: 0.35, default: 0.25 },
    subTopic:       { type: String },
    tags:           { type: [String], default: [] },
    language:       { type: String },
    codeSnippet:    { type: String },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ moduleId: 1, isActive: 1 });
QuestionSchema.index({ moduleId: 1, subTopic: 1 });
QuestionSchema.index({ difficulty: 1 });

export const Question = mongoose.model<QuestionDocument>('Question', QuestionSchema);
