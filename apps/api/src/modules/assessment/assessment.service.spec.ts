import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  const tenantId = 'tenant-1';
  const firebaseUid = 'firebase-uid-real-user';
  const internalUserId = 'usr-cuid-real-user';

  let prisma: any;
  let webhookDispatch: any;
  let service: AssessmentService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      assessmentConfig: { findUnique: jest.fn() },
      assessmentSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    webhookDispatch = { dispatch: jest.fn() };
    const questionBank = { get: jest.fn() };
    const adaptiveTesting = { next: jest.fn() };
    const pillarQuestions = { getQuestionsForDimension: jest.fn().mockResolvedValue([]), getQuestionById: jest.fn() };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new AssessmentService(
      prisma,
      webhookDispatch,
      questionBank as any,
      adaptiveTesting as any,
      pillarQuestions as any,
      request,
    );
  });

  describe('startSession', () => {
    it('resolves the internal User.id from firebaseUid before creating a session, not the raw Firebase uid', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentConfig.findUnique.mockResolvedValue({
        id: 'cfg-1',
        tenantId,
        pillar: 'vision',
        timeLimitMin: 30,
      });
      prisma.assessmentSession.create.mockResolvedValue({
        id: 'sess-1',
        pillar: 'vision',
      });

      await service.startSession(firebaseUid, { configId: 'cfg-1' } as any);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { firebaseUid, tenantId },
      });
      const createArgs = prisma.assessmentSession.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe(internalUserId);
      expect(createArgs.data.userId).not.toBe(firebaseUid);
    });

    it('throws NotFoundException for a freshly-registered/unseen firebaseUid with no matching User row', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.startSession(firebaseUid, { configId: 'cfg-1' } as any),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.assessmentSession.create).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('matches session ownership against the internal userId, not the firebaseUid', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
      });

      const session = await service.getSession('sess-1', firebaseUid);

      expect(session.userId).toBe(internalUserId);
    });

    it('rejects when the session belongs to a different internal userId', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: 'someone-else',
      });

      await expect(
        service.getSession('sess-1', firebaseUid),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAnswers', () => {
    it('resolves the internal user before validating session ownership and submits successfully', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        startedAt: new Date(),
        config: { timeLimitMin: 30 },
      });
      prisma.assessmentSession.update.mockResolvedValue({
        id: 'sess-1',
        status: 'done',
      });

      const result = await service.submitAnswers('sess-1', firebaseUid, {
        answers: [],
        metadata: {},
      } as any);

      expect(result.status).toBe('done');
      expect(prisma.assessmentSession.update).toHaveBeenCalled();
    });

    it('fires an assessment.completed webhook event on successful submission', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        startedAt: new Date(),
        config: { timeLimitMin: 30 },
      });
      prisma.assessmentSession.update.mockResolvedValue({
        id: 'sess-1',
        status: 'done',
        pillar: 'leadership',
      });

      await service.submitAnswers('sess-1', firebaseUid, {
        answers: [],
        metadata: {},
      } as any);

      expect(webhookDispatch.dispatch).toHaveBeenCalledWith(tenantId, 'assessment.completed', {
        sessionId: 'sess-1',
        userId: internalUserId,
        pillar: 'leadership',
      });
    });

    it('rejects submission once the config time limit has elapsed since startedAt', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        startedAt: new Date(Date.now() - 31 * 60_000),
        config: { timeLimitMin: 30 },
      });

      await expect(
        service.submitAnswers('sess-1', firebaseUid, { answers: [], metadata: {} } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });

    it('allows submission right up to the deadline but not past it', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        startedAt: new Date(Date.now() - 10 * 60_000),
        config: { timeLimitMin: 30 },
      });
      prisma.assessmentSession.update.mockResolvedValue({ id: 'sess-1', status: 'done' });

      const result = await service.submitAnswers('sess-1', firebaseUid, {
        answers: [],
        metadata: {},
      } as any);

      expect(result.status).toBe('done');
    });
  });
});
