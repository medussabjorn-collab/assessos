import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { IrtParams, ThreePlIrtService } from './three-pl-irt.service';

export interface AnsweredItem {
  questionId: string;
  correct: boolean;
}

export interface AdaptiveNextInput {
  moduleId: string;
  answered: AnsweredItem[];
  initialTheta?: number;
  minQuestions?: number;
}

// Drives a computerized adaptive test (CAT) over the Mongo binary item bank
// using the 3PL engine: estimate ability from answered items, then pick the
// most-informative unanswered item (or terminate when SE is low enough).
@Injectable()
export class AdaptiveTestingService {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    private readonly irt: ThreePlIrtService,
  ) {}

  private toParams(q: {
    difficulty: number;
    discrimination: number;
    guessing: number;
  }): IrtParams {
    return { a: q.discrimination, b: q.difficulty, c: q.guessing };
  }

  async next(tenantId: string | undefined, input: AdaptiveNextInput) {
    const answered = input.answered ?? [];
    const answeredIds = answered.map((a) => a.questionId);

    // Params of the items already answered, in answer order.
    const answeredDocs = await this.questionModel
      .find({ _id: { $in: answeredIds } })
      .select('difficulty discrimination guessing')
      .lean();
    const paramsById = new Map(answeredDocs.map((d) => [String(d._id), this.toParams(d)]));

    const responses = answered
      .filter((a) => paramsById.has(a.questionId))
      .map((a) => ({ correct: a.correct, params: paramsById.get(a.questionId)! }));

    const theta = this.irt.estimateTheta(responses, input.initialTheta ?? 0);
    const se = this.irt.computeSE(theta, responses.map((r) => r.params));
    const terminate = this.irt.shouldTerminate(se, responses.length, input.minQuestions ?? 10);

    let nextQuestionId: string | null = null;
    if (!terminate) {
      // Candidate pool: active items in this module (tenant's own + shared),
      // excluding what's already been answered.
      const candidateFilter: Record<string, unknown> = {
        moduleId: input.moduleId,
        isActive: true,
        _id: { $nin: answeredIds },
        $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }],
      };
      const candidates = await this.questionModel
        .find(candidateFilter as any)
        .select('difficulty discrimination guessing')
        .lean();
      nextQuestionId = this.irt.selectNextQuestion(
        theta,
        candidates.map((c) => ({ id: String(c._id), params: this.toParams(c) })),
      );
    }

    return {
      ability: this.irt.buildAbility(theta, se),
      answeredCount: responses.length,
      terminate: terminate || nextQuestionId === null,
      nextQuestionId,
    };
  }
}
