import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  const tenantId = 'tenant-1';
  const firebaseUid = 'firebase-uid-real-user';
  const internalUserId = 'usr-cuid-real-user';

  let prisma: any;
  let webhookDispatch: any;
  let identity: any;
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
    identity = { isVerifiedForUser: jest.fn().mockResolvedValue(true) };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new AssessmentService(
      prisma,
      webhookDispatch,
      questionBank as any,
      adaptiveTesting as any,
      pillarQuestions as any,
      identity as any,
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

    it('rejects when aiProctoring is on and the user has no verified identity check', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentConfig.findUnique.mockResolvedValue({
        id: 'cfg-1',
        tenantId,
        pillar: 'vision',
        timeLimitMin: 30,
        aiProctoring: true,
      });
      identity.isVerifiedForUser.mockResolvedValue(false);

      await expect(
        service.startSession(firebaseUid, { configId: 'cfg-1' } as any),
      ).rejects.toThrow(BadRequestException);

      expect(identity.isVerifiedForUser).toHaveBeenCalledWith(tenantId, internalUserId);
      expect(prisma.assessmentSession.create).not.toHaveBeenCalled();
    });

    it('allows starting when aiProctoring is on and the user has a verified identity check', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentConfig.findUnique.mockResolvedValue({
        id: 'cfg-1',
        tenantId,
        pillar: 'vision',
        timeLimitMin: 30,
        aiProctoring: true,
      });
      prisma.assessmentSession.create.mockResolvedValue({ id: 'sess-1', pillar: 'vision' });
      identity.isVerifiedForUser.mockResolvedValue(true);

      await service.startSession(firebaseUid, { configId: 'cfg-1' } as any);

      expect(prisma.assessmentSession.create).toHaveBeenCalled();
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

  describe('pauseSession / resumeSession', () => {
    it('pauseSession sets status paused and records pausedAt', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
      });
      prisma.assessmentSession.update.mockResolvedValue({
        id: 'sess-1',
        status: 'paused',
        pausedAt: new Date(),
      });

      const result = await service.pauseSession('sess-1', firebaseUid);

      expect(result.status).toBe('paused');
      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: expect.objectContaining({ status: 'paused', pausedAt: expect.any(Date) }),
      });
    });

    it('pauseSession rejects a session that is not active', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'paused',
      });

      await expect(service.pauseSession('sess-1', firebaseUid)).rejects.toThrow(BadRequestException);
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });

    it('resumeSession accumulates the elapsed pause into totalPausedSec and clears pausedAt', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'paused',
        pausedAt: new Date(Date.now() - 90_000),
        totalPausedSec: 30,
      });
      prisma.assessmentSession.update.mockResolvedValue({
        id: 'sess-1',
        status: 'active',
        totalPausedSec: 120,
      });

      const result = await service.resumeSession('sess-1', firebaseUid);

      expect(result.status).toBe('active');
      const updateArgs = prisma.assessmentSession.update.mock.calls[0][0];
      expect(updateArgs.data.pausedAt).toBeNull();
      expect(updateArgs.data.totalPausedSec).toBeGreaterThanOrEqual(30 + 89);
      expect(updateArgs.data.totalPausedSec).toBeLessThanOrEqual(30 + 91);
    });

    it('resumeSession rejects a session that is not paused', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
      });

      await expect(service.resumeSession('sess-1', firebaseUid)).rejects.toThrow(BadRequestException);
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
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

    it('rejects submission when the session has been proctoring-revoked', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        startedAt: new Date(),
        config: { timeLimitMin: 30 },
        proctoringRevoked: true,
      });

      await expect(
        service.submitAnswers('sess-1', firebaseUid, { answers: [], metadata: {} } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
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

    it('extends the deadline by totalPausedSec — a submission that would otherwise be late succeeds', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'active',
        // 31 min since startedAt on a 30 min limit — would fail without
        // the 5 min of accumulated pause time pushing the deadline back.
        startedAt: new Date(Date.now() - 31 * 60_000),
        totalPausedSec: 5 * 60,
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
