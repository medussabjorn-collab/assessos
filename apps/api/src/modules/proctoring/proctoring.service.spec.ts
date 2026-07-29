import { NotFoundException } from '@nestjs/common';
import { ProctoringService } from './proctoring.service';

describe('ProctoringService', () => {
  const tenantId = 'tenant-1';
  const userId = 'usr-1';
  const sessionId = 'sess-1';

  let prisma: any;
  let notifications: any;
  let chain: any;
  let incidents: any;
  let policy: any;
  let service: ProctoringService;

  const DEFAULT_POLICY = { warningThreshold: 30, criticalThreshold: 70, autoTerminateThreshold: 100 };

  beforeEach(() => {
    prisma = {
      assessmentSession: {
        findFirst: jest.fn().mockResolvedValue({ id: sessionId, tenantId, configId: 'cfg-1', status: 'active', proctoringRevoked: false }),
        update: jest.fn().mockResolvedValue({}),
      },
      proctoringEventLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    notifications = { notifyProctoringAlert: jest.fn().mockResolvedValue(undefined) };
    chain = { append: jest.fn().mockResolvedValue(undefined) };
    incidents = { autoOpenOnCritical: jest.fn().mockResolvedValue(undefined) };
    policy = { getEffective: jest.fn().mockResolvedValue({ ...DEFAULT_POLICY }) };
    service = new ProctoringService(prisma, notifications, chain, incidents, policy);
  });

  describe('logEvent', () => {
    it('throws NotFoundException when the session does not exist for this tenant', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue(null);

      await expect(
        service.logEvent(tenantId, userId, { sessionId, eventType: 'tab_switch' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a session already marked done', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue({ id: sessionId, tenantId, status: 'done' });

      await expect(
        service.logEvent(tenantId, userId, { sessionId, eventType: 'tab_switch' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('computes totalRisk from this event alone when there is no history', async () => {
      const result = await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      // window_blur score = 10
      expect(result).toEqual({ totalRisk: 10, level: 'safe' });
    });

    it('sums decayed prior events with the new event score', async () => {
      const now = Date.now();
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'multiple_faces', occurredAt: new Date(now) }, // score 50, no decay yet
      ]);

      // multiple_faces (50, fresh) + window_blur (10) = 60
      const result = await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(result.totalRisk).toBe(60);
      expect(result.level).toBe('warning'); // >= 30, < 70
    });

    it('caps totalRisk at 100', async () => {
      const now = Date.now();
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'impostor_suspected', occurredAt: new Date(now) }, // 70
        { eventType: 'remote_desktop', occurredAt: new Date(now) }, // 60
      ]);

      const result = await service.logEvent(tenantId, userId, { sessionId, eventType: 'impostor_suspected' });

      expect(result.totalRisk).toBe(100);
    });

    it('uses the tenant policy thresholds, not hardcoded ones, to determine level', async () => {
      policy.getEffective.mockResolvedValue({ warningThreshold: 5, criticalThreshold: 8, autoTerminateThreshold: 100 });

      // window_blur score = 10 >= criticalThreshold 8
      const result = await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(result.level).toBe('critical');
      expect(policy.getEffective).toHaveBeenCalledWith(tenantId, 'cfg-1');
    });

    it('commits the event into the integrity chain', async () => {
      await service.logEvent(tenantId, userId, { sessionId, eventType: 'tab_switch' });

      expect(chain.append).toHaveBeenCalledWith(
        tenantId,
        sessionId,
        'proctoring_event',
        expect.objectContaining({ eventType: 'tab_switch' }),
      );
    });

    it('fires a proctoring alert notification when the level is not safe', async () => {
      const now = Date.now();
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'multiple_faces', occurredAt: new Date(now) },
      ]);

      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(notifications.notifyProctoringAlert).toHaveBeenCalledWith(
        tenantId, userId, sessionId, 'window_blur', 60,
      );
    });

    it('does not fire a notification when the level stays safe', async () => {
      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(notifications.notifyProctoringAlert).not.toHaveBeenCalled();
    });

    it('auto-opens an incident when the level reaches critical', async () => {
      policy.getEffective.mockResolvedValue({ warningThreshold: 30, criticalThreshold: 40, autoTerminateThreshold: 100 });

      // window_blur = 10 < 40; needs prior history to push over
      const now = Date.now();
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'multiple_faces', occurredAt: new Date(now) }, // 50
      ]);

      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(incidents.autoOpenOnCritical).toHaveBeenCalledWith(tenantId, userId, sessionId, 'window_blur', 60);
    });

    it('does not open an incident below the critical threshold', async () => {
      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(incidents.autoOpenOnCritical).not.toHaveBeenCalled();
    });

    it('auto-terminates the session (proctoringRevoked=true) once risk crosses autoTerminateThreshold', async () => {
      policy.getEffective.mockResolvedValue({ warningThreshold: 30, criticalThreshold: 70, autoTerminateThreshold: 55 });

      const now = Date.now();
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'multiple_faces', occurredAt: new Date(now) }, // 50
      ]);

      // 50 + 10 (window_blur) = 60 >= autoTerminateThreshold 55
      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { proctoringRevoked: true },
      });
      expect(chain.append).toHaveBeenCalledWith(
        tenantId, sessionId, 'system',
        expect.objectContaining({ action: 'session_auto_terminated' }),
      );
    });

    it('does not re-trigger auto-terminate on a session already revoked', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue({
        id: sessionId, tenantId, configId: 'cfg-1', status: 'active', proctoringRevoked: true,
      });
      policy.getEffective.mockResolvedValue({ warningThreshold: 30, criticalThreshold: 70, autoTerminateThreshold: 5 });

      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });

    it('does not auto-terminate below the threshold', async () => {
      await service.logEvent(tenantId, userId, { sessionId, eventType: 'window_blur' });

      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });

    it('falls back to a low risk weight (5) for an unrecognized event type', async () => {
      const result = await service.logEvent(tenantId, userId, { sessionId, eventType: 'not_a_real_type' as any });

      expect(result.totalRisk).toBe(5);
    });
  });

  describe('getReport', () => {
    it('aggregates events into counts, violation/warning tallies, and peak risk', async () => {
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'multiple_faces', totalRisk: 50, occurredAt: new Date() }, // score 50 -> violation
        { eventType: 'window_blur', totalRisk: 60, occurredAt: new Date() }, // score 10 -> warning
        { eventType: 'multiple_faces', totalRisk: 90, occurredAt: new Date() }, // violation
      ]);

      const report = await service.getReport(sessionId, tenantId);

      expect(report.totalEvents).toBe(3);
      expect(report.byType).toEqual({ multiple_faces: 2, window_blur: 1 });
      expect(report.violations).toBe(2);
      expect(report.warnings).toBe(1);
      expect(report.peakRisk).toBe(90);
    });

    it('bands cheatingRisk as high and recommends manual review above the critical default', async () => {
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'impostor_suspected', totalRisk: 80, occurredAt: new Date() },
      ]);

      const report = await service.getReport(sessionId);

      expect(report.cheatingRisk).toBe('high');
      expect(report.integrityScore).toBe(20);
      expect(report.recommendations).toContain('Flag for manual review');
    });

    it('bands cheatingRisk as low with no recommendations when peak risk is minimal', async () => {
      prisma.proctoringEventLog.findMany.mockResolvedValue([
        { eventType: 'window_blur', totalRisk: 10, occurredAt: new Date() },
      ]);

      const report = await service.getReport(sessionId);

      expect(report.cheatingRisk).toBe('low');
      expect(report.recommendations).toEqual([]);
    });
  });

  describe('compatibility surface (interviews live-interview flow)', () => {
    it('monitorSession is a lifecycle no-op that reports started', async () => {
      expect(await service.monitorSession(sessionId)).toEqual({ monitoringStarted: true });
    });

    it('generateProctoringReport delegates to getReport', async () => {
      prisma.proctoringEventLog.findMany.mockResolvedValue([]);
      const report = await service.generateProctoringReport(sessionId);
      expect(report.sessionId).toBe(sessionId);
    });
  });
});
