import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

export interface ListQuestionsQuery {
  moduleId?: string;
  subTopic?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}

/**
 * Ported from leadership-assessment's questionController + Question model.
 * Tenant scoping: reads return the tenant's own items PLUS shared/global items
 * (tenantId = null); writes are always stamped with the caller's tenantId.
 */
@Injectable()
export class QuestionBankService {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async list(tenantId: string | undefined, q: ListQuestionsQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      // tenant's own items + shared (null) items
      $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }],
    };
    if (q.moduleId) filter.moduleId = q.moduleId;
    if (q.subTopic) filter.subTopic = q.subTopic;
    if (q.isActive !== undefined) filter.isActive = q.isActive === 'true';

    const [items, total] = await Promise.all([
      // Hide the answer key on list responses (leadership did the same).
      this.questionModel
        .find(filter)
        .select('-correctIndex -explanation')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.questionModel.countDocuments(filter),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async get(tenantId: string | undefined, id: string) {
    const question = await this.questionModel.findById(id).lean();
    if (!question || !this.readable(question, tenantId)) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async create(tenantId: string, dto: CreateQuestionDto) {
    const created = await this.questionModel.create({
      ...dto,
      tenantId,
      isActive: dto.isActive ?? true,
    });
    return created.toObject();
  }

  async bulkImport(tenantId: string, questions: CreateQuestionDto[]) {
    const docs = questions.map((dto) => ({
      ...dto,
      tenantId,
      isActive: dto.isActive ?? true,
    }));
    const inserted = await this.questionModel.insertMany(docs);
    return { inserted: inserted.length };
  }

  async update(tenantId: string, id: string, dto: UpdateQuestionDto) {
    // Only the owning tenant may mutate (shared items are read-only here).
    const updated = await this.questionModel
      .findOneAndUpdate({ _id: id, tenantId }, dto, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.questionModel
      .findOneAndDelete({ _id: id, tenantId })
      .lean();
    if (!deleted) throw new NotFoundException('Question not found');
    return { deleted: true };
  }

  private readable(question: { tenantId?: string | null }, tenantId: string | undefined) {
    return (
      question.tenantId == null || question.tenantId === tenantId
    );
  }
}
