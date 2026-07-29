import { EnvironmentService } from './environment.service';
import { DEFAULT_POLICY } from './policy.service';

describe('EnvironmentService', () => {
  const tenantId = 'tenant-1';
  const userId = 'usr-1';
  const sessionId = 'sess-1';

  let prisma: any;
  let proctoring: any;
  let policy: any;
  let service: EnvironmentService;

  beforeEach(() => {
    prisma = {
      environmentScan: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'scan-1', ...data })),
        findFirst: jest.fn(),
      },
    };
    proctoring = { logEvent: jest.fn().mockResolvedValue(undefined) };
    policy = { getEffective: jest.fn().mockResolvedValue({ ...DEFAULT_POLICY }) };
    service = new EnvironmentService(prisma, proctoring, policy);
  });

  describe('evaluate — pure detection logic', () => {
    it('is clear with no findings when nothing anomalous is reported', () => {
      const { status, findings, events } = service.evaluate({}, DEFAULT_POLICY);

      expect(status).toBe('clear');
      expect(findings).toEqual([]);
      expect(events).toEqual([]);
    });

    it('blocks and flags extra_person when more people are detected than the policy allows', () => {
      const { status, findings, events } = service.evaluate({ personsDetected: 2 }, DEFAULT_POLICY);

      expect(status).toBe('blocked');
      expect(findings).toContain('1 extra person(s) detected');
      expect(events).toContain('extra_person');
    });

    it('allows extra persons up to the policy maxExtraPersons without blocking', () => {
      const lenient = { ...DEFAULT_POLICY, maxExtraPersons: 1 };
      const { status, events } = service.evaluate({ personsDetected: 2 }, lenient);

      expect(status).toBe('clear');
      expect(events).not.toContain('extra_person');
    });

    it('flags (does not block) a second monitor when the policy disallows it', () => {
      const { status, findings, events } = service.evaluate({ monitorsDetected: 2 }, DEFAULT_POLICY);

      expect(status).toBe('flagged');
      expect(findings).toContain('Second screen detected');
      expect(events).toContain('extra_monitor');
    });

    it('does not flag a second monitor when the policy explicitly allows it', () => {
      const lenient = { ...DEFAULT_POLICY, allowSecondScreen: true };
      const { status, events } = service.evaluate({ monitorsDetected: 2 }, lenient);

      expect(status).toBe('clear');
      expect(events).not.toContain('extra_monitor');
    });

    it('blocks when a phone is detected', () => {
      const { status, events } = service.evaluate({ phoneDetected: true }, DEFAULT_POLICY);

      expect(status).toBe('blocked');
      expect(events).toContain('phone_detected');
    });

    it('flags (not blocks) notes/whiteboard/low-lighting/no-face findings', () => {
      const { status, findings, events } = service.evaluate(
        { notesDetected: true, lightingOk: false, faceVisible: false },
        DEFAULT_POLICY,
      );

      expect(status).toBe('flagged');
      expect(findings).toEqual(
        expect.arrayContaining(['Notes detected', 'Poor lighting', 'Face not clearly visible']),
      );
      expect(events).toEqual(expect.arrayContaining(['notes_detected', 'low_lighting', 'face_not_detected']));
    });

    it('flags VPN/proxy/Tor and only blocks when the policy action is block', () => {
      const flagOnly = service.evaluate({ vpnDetected: true }, { ...DEFAULT_POLICY, vpnAction: 'flag' });
      const blocked = service.evaluate({ vpnDetected: true }, { ...DEFAULT_POLICY, vpnAction: 'block' });

      expect(flagOnly.status).toBe('flagged');
      expect(blocked.status).toBe('blocked');
      expect(flagOnly.events).toContain('proxy_or_tor');
    });

    it('notes an IP/declared country mismatch as a flagged (not blocked) finding with no event', () => {
      const { status, findings, events } = service.evaluate(
        { ipCountry: 'US', declaredCountry: 'CA' },
        DEFAULT_POLICY,
      );

      expect(status).toBe('flagged');
      expect(findings[0]).toContain('IP country (US) differs from declared (CA)');
      expect(events).toEqual([]);
    });

    it('blocks remote access when the policy requires blocking it', () => {
      const { status, events } = service.evaluate({ remoteAccessDetected: true }, { ...DEFAULT_POLICY, blockRemoteAccess: true });

      expect(status).toBe('blocked');
      expect(events).toContain('remote_desktop');
    });

    it('does not block remote access when the policy allows it', () => {
      const { status } = service.evaluate({ remoteAccessDetected: true }, { ...DEFAULT_POLICY, blockRemoteAccess: false });

      expect(status).toBe('flagged');
    });

    it('blocks when a lockdown browser is required but not active', () => {
      const { status, findings } = service.evaluate(
        { lockdownActive: false },
        { ...DEFAULT_POLICY, requireLockdownBrowser: true },
      );

      expect(status).toBe('blocked');
      expect(findings).toContain('Lockdown browser required but not active');
    });

    it('flags VM and screen-share detection without blocking', () => {
      const { status, events } = service.evaluate({ vmDetected: true, screenShareDetected: true }, DEFAULT_POLICY);

      expect(status).toBe('flagged');
      expect(events).toEqual(expect.arrayContaining(['vm_detected', 'screen_share']));
    });
  });

  describe('submitScan', () => {
    it('persists the scan with the evaluated status and findings', async () => {
      const scan = await service.submitScan(tenantId, userId, { personsDetected: 2 });

      expect(scan.status).toBe('blocked');
      expect(prisma.environmentScan.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tenantId, personsDetected: 2, status: 'blocked' }) }),
      );
    });

    it('feeds every anomaly event into the session risk score when a sessionId is present', async () => {
      await service.submitScan(tenantId, userId, { sessionId, personsDetected: 2, phoneDetected: true });

      expect(proctoring.logEvent).toHaveBeenCalledWith(
        tenantId, userId, expect.objectContaining({ sessionId, eventType: 'extra_person' }),
      );
      expect(proctoring.logEvent).toHaveBeenCalledWith(
        tenantId, userId, expect.objectContaining({ sessionId, eventType: 'phone_detected' }),
      );
    });

    it('does not attempt to log events when there is no sessionId yet (pre-session scan)', async () => {
      await service.submitScan(tenantId, userId, { personsDetected: 2 });

      expect(proctoring.logEvent).not.toHaveBeenCalled();
    });

    it('resolves the policy using the scan configId, falling back to null', async () => {
      await service.submitScan(tenantId, userId, { configId: 'cfg-1' });

      expect(policy.getEffective).toHaveBeenCalledWith(tenantId, 'cfg-1');
    });
  });

  describe('isClear / hasCleanPreSessionScan', () => {
    it('isClear is true only when the latest scan for the session is exactly clear', async () => {
      prisma.environmentScan.findFirst.mockResolvedValue({ status: 'clear' });
      expect(await service.isClear(tenantId, sessionId)).toBe(true);
    });

    it('isClear is false for a flagged (not blocked, but not clear) latest scan', async () => {
      prisma.environmentScan.findFirst.mockResolvedValue({ status: 'flagged' });
      expect(await service.isClear(tenantId, sessionId)).toBe(false);
    });

    it('isClear is false when no scan exists for the session', async () => {
      prisma.environmentScan.findFirst.mockResolvedValue(null);
      expect(await service.isClear(tenantId, sessionId)).toBe(false);
    });

    it('hasCleanPreSessionScan accepts clear or flagged, only rejects blocked or missing', async () => {
      prisma.environmentScan.findFirst.mockResolvedValue({ status: 'flagged' });
      expect(await service.hasCleanPreSessionScan(tenantId, userId)).toBe(true);

      prisma.environmentScan.findFirst.mockResolvedValue({ status: 'blocked' });
      expect(await service.hasCleanPreSessionScan(tenantId, userId)).toBe(false);

      prisma.environmentScan.findFirst.mockResolvedValue(null);
      expect(await service.hasCleanPreSessionScan(tenantId, userId)).toBe(false);
    });

    it('hasCleanPreSessionScan scopes the lookup to pre_session scans only', async () => {
      prisma.environmentScan.findFirst.mockResolvedValue({ status: 'clear' });

      await service.hasCleanPreSessionScan(tenantId, userId);

      expect(prisma.environmentScan.findFirst).toHaveBeenCalledWith({
        where: { tenantId, userId, scanType: 'pre_session' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
