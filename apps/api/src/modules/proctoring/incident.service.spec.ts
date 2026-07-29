import { NotFoundException } from '@nestjs/common';
import { IncidentService } from './incident.service';

describe('IncidentService', () => {
  const tenantId = 'tenant-1';
  const sessionId = 'sess-1';
  const userId = 'usr-1';

  let prisma: any;
  let chain: any;
  let service: IncidentService;

  beforeEach(() => {
    prisma = {
      proctoringIncident: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'inc-1', ...data })),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'inc-1', ...data })),
      },
      proctoringEventLog: { findMany: jest.fn().mockResolvedValue([]) },
      evidenceArtifact: { findMany: jest.fn().mockResolvedValue([]) },
      identityVerification: { findMany: jest.fn().mockResolvedValue([]) },
      environmentScan: { findMany: jest.fn().mockResolvedValue([]) },
    };
    chain = {
      append: jest.fn().mockResolvedValue(undefined),
      verify: jest.fn().mockResolvedValue({ valid: true, entries: 0, brokenAtSeq: null }),
      getChain: jest.fn().mockResolvedValue([]),
    };
    service = new IncidentService(prisma, chain);
  });

  describe('open — severity + SLA assignment', () => {
    it('assigns severity from the category taxonomy when none is given explicitly', async () => {
      const incident = await service.open(tenantId, {
        sessionId, userId, category: 'impostor_suspected',
      });

      expect(incident.severity).toBe('critical');
    });

    it('honors an explicitly-passed severity over the category default', async () => {
      const incident = await service.open(tenantId, {
        sessionId, userId, category: 'impostor_suspected', severity: 'low',
      });

      expect(incident.severity).toBe('low');
    });

    it('falls back to risk-score-based tiering for a category not in the taxonomy', async () => {
      const high = await service.open(tenantId, { sessionId, userId, category: 'unknown_thing', riskScore: 75 });
      const medium = await service.open(tenantId, { sessionId, userId, category: 'unknown_thing', riskScore: 40 });
      const low = await service.open(tenantId, { sessionId, userId, category: 'unknown_thing', riskScore: 10 });

      expect(high.severity).toBe('high');
      expect(medium.severity).toBe('medium');
      expect(low.severity).toBe('low');
    });

    it('sets a shorter SLA deadline for higher-severity incidents', async () => {
      const critical = await service.open(tenantId, { sessionId, userId, category: 'impostor_suspected' });
      const low = await service.open(tenantId, { sessionId, userId, category: 'nonexistent', riskScore: 0 });

      expect(new Date(critical.slaDueAt!).getTime()).toBeLessThan(new Date(low.slaDueAt!).getTime());
    });

    it('records the incident_opened action in the integrity chain', async () => {
      await service.open(tenantId, { sessionId, userId, category: 'phone_detected', openedBy: 'usr-admin' });

      expect(chain.append).toHaveBeenCalledWith(
        tenantId, sessionId, 'proctor_action',
        expect.objectContaining({ action: 'incident_opened', category: 'phone_detected', openedBy: 'usr-admin' }),
      );
    });

    it('defaults openedBy to system when not provided', async () => {
      const incident = await service.open(tenantId, { sessionId, userId, category: 'phone_detected' });

      expect(incident.openedBy).toBe('system');
    });
  });

  describe('autoOpenOnCritical', () => {
    it('opens a new incident when none is already open for this session+category', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue(null);

      const incident = await service.autoOpenOnCritical(tenantId, userId, sessionId, 'multiple_faces', 80);

      expect(prisma.proctoringIncident.create).toHaveBeenCalled();
      expect(incident.description).toContain('multiple_faces');
      expect(incident.description).toContain('80');
    });

    it('dedupes — returns the existing open/in_review incident instead of creating a duplicate', async () => {
      const existing = { id: 'inc-existing', category: 'multiple_faces', status: 'open' };
      prisma.proctoringIncident.findFirst.mockResolvedValue(existing);

      const result = await service.autoOpenOnCritical(tenantId, userId, sessionId, 'multiple_faces', 80);

      expect(result).toBe(existing);
      expect(prisma.proctoringIncident.create).not.toHaveBeenCalled();
    });
  });

  describe('list / get', () => {
    it('list scopes to tenant and applies optional status/severity/sessionId filters', async () => {
      prisma.proctoringIncident.findMany.mockResolvedValue([]);

      await service.list(tenantId, { status: 'open', severity: 'high', sessionId });

      expect(prisma.proctoringIncident.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: 'open', severity: 'high', sessionId },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('get throws NotFoundException for an incident outside the tenant', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue(null);

      await expect(service.get(tenantId, 'inc-missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assign / review', () => {
    it('assign sets assignedTo and moves status to in_review, recording the action', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });

      const updated = await service.assign(tenantId, 'inc-1', 'usr-reviewer', 'usr-assignee');

      expect(updated.assignedTo).toBe('usr-assignee');
      expect(updated.status).toBe('in_review');
      expect(chain.append).toHaveBeenCalledWith(
        tenantId, sessionId, 'proctor_action',
        expect.objectContaining({ action: 'incident_assigned', assignedTo: 'usr-assignee', by: 'usr-reviewer' }),
      );
    });

    it('review resolves the incident when dismiss is not set', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });

      const updated = await service.review(tenantId, 'inc-1', 'usr-reviewer', {
        resolution: 'warning_issued', note: 'told them to stop',
      });

      expect(updated.status).toBe('resolved');
      expect(updated.resolution).toBe('warning_issued');
      expect(updated.resolutionNote).toBe('told them to stop');
      expect(updated.reviewedById).toBe('usr-reviewer');
    });

    it('review dismisses the incident when dismiss is true', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });

      const updated = await service.review(tenantId, 'inc-1', 'usr-reviewer', {
        resolution: 'no_action', dismiss: true,
      });

      expect(updated.status).toBe('dismissed');
    });
  });

  describe('appeal workflow', () => {
    it('requestAppeal sets appealStatus to requested with the reason', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });

      const updated = await service.requestAppeal(tenantId, 'inc-1', userId, 'it was my roommate');

      expect(updated.appealStatus).toBe('requested');
      expect(updated.appealReason).toBe('it was my roommate');
    });

    it('resolveAppeal records the outcome, resolver, and note', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });

      const updated = await service.resolveAppeal(tenantId, 'inc-1', 'usr-admin', 'overturned', 'verified benign');

      expect(updated.appealStatus).toBe('overturned');
      expect(updated.appealResolvedById).toBe('usr-admin');
      expect(updated.appealNote).toBe('verified benign');
    });
  });

  describe('evidenceExport', () => {
    it('bundles the incident with events, evidence, identity checks, environment scans, and chain verification', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });
      prisma.proctoringEventLog.findMany.mockResolvedValue([{ id: 'evt-1' }]);
      prisma.evidenceArtifact.findMany.mockResolvedValue([{ id: 'art-1' }]);
      chain.verify.mockResolvedValue({ valid: true, entries: 5, brokenAtSeq: null });
      chain.getChain.mockResolvedValue([{ seq: 0 }, { seq: 1 }]);

      const bundle = await service.evidenceExport(tenantId, 'inc-1');

      expect(bundle.incident.id).toBe('inc-1');
      expect(bundle.integrity.valid).toBe(true);
      expect(bundle.counts).toEqual({
        events: 1, evidence: 1, identityChecks: 0, environmentScans: 0, chainEntries: 2,
      });
    });

    it('surfaces a broken chain in the integrity field', async () => {
      prisma.proctoringIncident.findFirst.mockResolvedValue({ id: 'inc-1', sessionId, tenantId });
      chain.verify.mockResolvedValue({ valid: false, entries: 3, brokenAtSeq: 1 });

      const bundle = await service.evidenceExport(tenantId, 'inc-1');

      expect(bundle.integrity).toEqual({ valid: false, entries: 3, brokenAtSeq: 1 });
    });
  });
});
