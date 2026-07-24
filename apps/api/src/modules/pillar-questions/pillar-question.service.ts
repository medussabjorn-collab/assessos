import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PillarQuestion, PillarQuestionDocument } from './schemas/pillar-question.schema';
import { CreatePillarQuestionDto, UpdatePillarQuestionDto } from './dto/pillar-question.dto';

export interface ListPillarQuestionsQuery {
  dimensionId?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}

// Real, admin-editable Likert item bank for pillar/dimension assessments
// (leadership) — replaces the old hardcoded 10-item in-memory array.
// Tenant scoping matches question-bank/question-bank.service.ts: reads
// return the tenant's own items plus shared/global items (tenantId: null);
// writes are always stamped with the caller's tenantId.
@Injectable()
export class PillarQuestionService {
  constructor(
    @InjectModel(PillarQuestion.name) private readonly model: Model<PillarQuestionDocument>,
  ) {}

  async list(tenantId: string | undefined, q: ListPillarQuestionsQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }],
    };
    if (q.dimensionId) filter.dimensionId = q.dimensionId;
    if (q.isActive !== undefined) filter.isActive = q.isActive === 'true';

    const [items, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  // Candidate-facing: every active question for one dimension, no
  // pagination wrapper — used to build a fixed-form session's question set.
  async getQuestionsForDimension(tenantId: string | undefined, dimensionId: string) {
    return this.model
      .find({
        dimensionId,
        isActive: true,
        $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }],
      })
      .lean();
  }

  async getQuestionById(tenantId: string | undefined, id: string) {
    const question = await this.model.findById(id).lean();
    if (!question || !this.readable(question, tenantId)) return null;
    return question;
  }

  async get(tenantId: string | undefined, id: string) {
    const question = await this.getQuestionById(tenantId, id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async create(tenantId: string, dto: CreatePillarQuestionDto) {
    const created = await this.model.create({ ...dto, tenantId, isActive: dto.isActive ?? true });
    return created.toObject();
  }

  async bulkImport(tenantId: string, questions: CreatePillarQuestionDto[]) {
    const docs = questions.map((dto) => ({ ...dto, tenantId, isActive: dto.isActive ?? true }));
    const inserted = await this.model.insertMany(docs);
    return { inserted: inserted.length };
  }

  async update(tenantId: string, id: string, dto: UpdatePillarQuestionDto) {
    const updated = await this.model
      .findOneAndUpdate({ _id: id, tenantId }, dto, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.model.findOneAndDelete({ _id: id, tenantId }).lean();
    if (!deleted) throw new NotFoundException('Question not found');
    return { deleted: true };
  }

  private readable(question: { tenantId?: string | null }, tenantId: string | undefined) {
    return question.tenantId == null || question.tenantId === tenantId;
  }
}
