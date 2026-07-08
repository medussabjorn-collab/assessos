import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Question } from '../models/mongo/Question';
import { AuthRequest } from '../types';
import * as R from '../utils/response';

const createSchema = z.object({
  moduleId:       z.enum(['technical','attitude','behavioral','psychometric','communication']),
  text:           z.string().min(10),
  options:        z.array(z.object({ index: z.number(), text: z.string().min(1) })).min(2).max(6),
  correctIndex:   z.number().int().min(0),
  explanation:    z.string().optional(),
  difficulty:     z.number().min(-3).max(3).default(0),
  discrimination: z.number().min(0.5).max(3).default(1),
  guessing:       z.number().min(0).max(0.35).default(0.25),
  subTopic:       z.string().optional(),
  tags:           z.array(z.string()).optional().default([]),
  codeSnippet:    z.string().optional(),
});

export async function listQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { moduleId, subTopic, isActive = 'true', page = '1', limit = '50' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (moduleId)  filter.moduleId  = moduleId;
    if (subTopic)  filter.subTopic  = subTopic;
    if (isActive)  filter.isActive  = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(Number(limit)).select('-correctIndex -explanation').lean(),
      Question.countDocuments(filter),
    ]);

    R.paginated(res, questions, Number(page), Number(limit), total);
  } catch (err) { next(err); }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question) { R.notFound(res, 'Question not found'); return; }
    R.ok(res, question);
  } catch (err) { next(err); }
}

export async function createQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.parse(req.body);
    const question = await Question.create({ ...data, isActive: true });
    R.created(res, question, 'Question created');
  } catch (err) { next(err); }
}

export async function updateQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.partial().parse(req.body);
    const question = await Question.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!question) { R.notFound(res, 'Question not found'); return; }
    R.ok(res, question, 'Question updated');
  } catch (err) { next(err); }
}

export async function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Soft-delete
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    R.noContent(res);
  } catch (err) { next(err); }
}

export async function bulkImport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.array(createSchema);
    const questions = schema.parse(req.body);
    const inserted = await Question.insertMany(questions.map(q => ({ ...q, isActive: true })));
    R.created(res, { count: inserted.length }, `${inserted.length} questions imported`);
  } catch (err) { next(err); }
}
