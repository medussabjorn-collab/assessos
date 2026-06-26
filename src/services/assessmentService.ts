import { prisma, redis } from '../config/database';
import { Question } from '../models/mongo/Question';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../middleware/audit';
import { AssessmentModuleId, IrtParams } from '../types';
import {
  estimateTheta,
  computeSE,
  buildAbility,
} from './irtService';
import { generateReportInsights } from './reportService';

const SESSION_CACHE_TTL = 7200; // 2h in seconds

// ─── Start Session ────────────────────────────────────────────────────────────

export async function startSession(userId: string, moduleId: AssessmentModuleId) {
  // moduleId is unique per organization (multi-tenancy); default tenant uses null org
  const config = await prisma.assessmentConfig.findFirst({ where: { moduleId } });
  if (!config) throw new AppError(404, `No config for module: ${moduleId}`);

  // Check for existing in-progress session
  const existing = await prisma.assessmentSession.findFirst({
    where: { userId, moduleId, status: 'in_progress' },
  });
  if (existing) return existing;

  // Fetch question pool from MongoDB
  const questions = await Question.find({ moduleId, isActive: true })
    .select('_id')
    .lean();

  if (questions.length < 10) {
    throw new AppError(400, `Not enough questions for module: ${moduleId}`);
  }

  // Shuffle question IDs
  const ids = questions.map(q => q._id!.toString());
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const selectedIds = ids.slice(0, config.totalQuestions);
  const expiresAt = new Date(Date.now() + config.timeLimitMin * 60 * 1000);

  const session = await prisma.assessmentSession.create({
    data: {
      userId,
      moduleId,
      configId:      config.id,
      status:        'in_progress',
      startedAt:     new Date(),
      expiresAt,
      questionOrder: selectedIds,
    },
  });

  // Cache session context in Redis
  await redis.setex(
    `session:${session.id}`,
    SESSION_CACHE_TTL,
    JSON.stringify({ questionOrder: selectedIds, currentIndex: 0 })
  );

  void logAudit(userId, 'assessment_started', 'sessions', session.id, { moduleId });

  return session;
}

// ─── Get Current Question ─────────────────────────────────────────────────────

export async function getCurrentQuestion(sessionId: string, userId: string) {
  const session = await getSessionOrThrow(sessionId, userId);
  if (session.status !== 'in_progress') throw new AppError(400, 'Session is not active');

  if (session.currentIndex >= session.questionOrder.length) {
    throw new AppError(400, 'All questions answered');
  }

  const questionId = session.questionOrder[session.currentIndex];
  const question = await Question.findById(questionId)
    .select('-correctIndex -explanation') // hide answer
    .lean();

  if (!question) throw new AppError(404, 'Question not found');

  return {
    question,
    questionNumber:  session.currentIndex + 1,
    totalQuestions:  session.questionOrder.length,
    timeRemainingMs: session.expiresAt
      ? Math.max(0, new Date(session.expiresAt).getTime() - Date.now())
      : null,
  };
}

// ─── Submit Answer ────────────────────────────────────────────────────────────

export async function submitAnswer(
  sessionId: string,
  userId: string,
  questionId: string,
  selectedOption: number | null,
  isFlagged = false,
  timeSpentSec = 0
) {
  const session = await getSessionOrThrow(sessionId, userId);
  if (session.status !== 'in_progress') throw new AppError(400, 'Session is not active');
  if (session.expiresAt && new Date() > session.expiresAt) {
    await expireSession(sessionId);
    throw new AppError(400, 'Session has expired');
  }

  // Get correct answer from MongoDB
  const question = await Question.findById(questionId).lean();
  if (!question) throw new AppError(404, 'Question not found');

  const isCorrect = selectedOption !== null && selectedOption === question.correctIndex;

  // Upsert answer
  const answer = await prisma.sessionAnswer.upsert({
    where: { sessionId_questionId: { sessionId, questionId } },
    create: {
      sessionId,
      questionId,
      selectedOption,
      isCorrect,
      isFlagged,
      timeSpentSec,
      answeredAt: new Date(),
    },
    update: {
      selectedOption,
      isCorrect,
      isFlagged,
      timeSpentSec,
      answeredAt: new Date(),
    },
  });

  // Advance to next question
  const nextIndex = session.currentIndex + 1;
  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data:  { currentIndex: nextIndex },
  });

  return { answer, nextIndex, totalQuestions: session.questionOrder.length };
}

// ─── Submit Full Session ──────────────────────────────────────────────────────

export async function submitSession(sessionId: string, userId: string) {
  const session = await getSessionOrThrow(sessionId, userId);
  if (session.status === 'submitted' || session.status === 'graded') {
    throw new AppError(400, 'Session already submitted');
  }

  // Fetch all answers
  const answers = await prisma.sessionAnswer.findMany({ where: { sessionId } });

  // Fetch all questions from MongoDB for scoring
  const questionIds = session.questionOrder;
  const questions   = await Question.find({ _id: { $in: questionIds } }).lean();
  const qMap        = new Map(questions.map(q => [q._id!.toString(), q]));

  const config = await prisma.assessmentConfig.findUnique({ where: { id: session.configId } });
  if (!config) throw new AppError(500, 'Config not found');

  let _rawScore = 0;
  let correct = 0, wrong = 0, skipped = 0;

  const responses: { correct: boolean; params: IrtParams }[] = [];

  for (const answer of answers) {
    const q = qMap.get(answer.questionId);
    if (!q) continue;

    if (answer.selectedOption === null) {
      skipped++;
    } else if (answer.isCorrect) {
      correct++;
      _rawScore += 1;
      responses.push({ correct: true,  params: { a: q.discrimination, b: q.difficulty, c: q.guessing } });
    } else {
      wrong++;
      if (config.negativeMarking) _rawScore -= config.negativePenalty;
      responses.push({ correct: false, params: { a: q.discrimination, b: q.difficulty, c: q.guessing } });
    }
  }

  const _totalAnswered = correct + wrong;
  const scorePercent  = (correct / questionIds.length) * 100;
  const passed        = scorePercent >= config.passMark;

  // IRT
  let irtTheta: number | null = null;
  let irtSe:    number | null = null;
  let irtTier:  string | null = null;

  if (responses.length >= 5) {
    irtTheta = estimateTheta(responses);
    irtSe    = computeSE(irtTheta, responses.map(r => r.params));
    const ability = buildAbility(irtTheta, irtSe);
    irtTier  = ability.tier;
  }

  // Sub-topic scores
  const subTopicMap = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const q = qMap.get(answer.questionId);
    if (!q?.subTopic) continue;
    const st = subTopicMap.get(q.subTopic) ?? { correct: 0, total: 0 };
    st.total++;
    if (answer.isCorrect) st.correct++;
    subTopicMap.set(q.subTopic, st);
  }
  const subTopicScores = Object.fromEntries(
    Array.from(subTopicMap.entries()).map(([topic, s]) => [
      topic,
      { ...s, percent: Math.round((s.correct / s.total) * 100) },
    ])
  );

  const aiInsights = generateReportInsights({
    score: scorePercent, correct, wrong, skipped,
    irtTheta, irtTier, subTopicScores, moduleId: session.moduleId as AssessmentModuleId,
  });

  // Create result
  const result = await prisma.assessmentResult.create({
    data: {
      userId,
      sessionId,
      moduleId:       session.moduleId,
      score:          scorePercent,
      passed,
      totalQuestions: questionIds.length,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      skippedAnswers: skipped,
      irtTheta:       irtTheta ?? undefined,
      irtSe:          irtSe ?? undefined,
      irtTier:        irtTier ?? undefined,
      subTopicScores,
      aiInsights,
    },
  });

  // Mark session submitted
  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data:  { status: 'graded', submittedAt: new Date() },
  });

  // Clear Redis cache
  await redis.del(`session:${sessionId}`);

  void logAudit(userId, 'assessment_submitted', 'sessions', sessionId, {
    moduleId: session.moduleId, score: scorePercent, passed,
  });

  return result;
}

// ─── Get Results ──────────────────────────────────────────────────────────────

export async function getUserResults(userId: string, moduleId?: AssessmentModuleId) {
  return prisma.assessmentResult.findMany({
    where: { userId, ...(moduleId ? { moduleId } : {}) },
    orderBy: { gradedAt: 'desc' },
    include: { session: { select: { startedAt: true, submittedAt: true, timeSpentSec: true } } },
  });
}

export async function getResultById(resultId: string, userId: string) {
  const result = await prisma.assessmentResult.findFirst({
    where: { id: resultId, userId },
    include: { session: true },
  });
  if (!result) throw new AppError(404, 'Result not found');
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSessionOrThrow(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new AppError(404, 'Session not found');
  return session;
}

async function expireSession(sessionId: string) {
  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data:  { status: 'expired' },
  });
  await redis.del(`session:${sessionId}`);
}
