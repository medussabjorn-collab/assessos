import { IntegrityChainService } from './integrity-chain.service';

describe('IntegrityChainService', () => {
  const tenantId = 'tenant-1';
  const sessionId = 'sess-1';

  let prisma: any;
  let service: IntegrityChainService;
  // In-memory chain store so append() -> getChain()/verify() round-trips realistically.
  let store: any[];

  beforeEach(() => {
    store = [];
    prisma = {
      integrityLogEntry: {
        findFirst: jest.fn().mockImplementation(({ where, orderBy }: any) => {
          const matches = store.filter((e) => e.sessionId === where.sessionId);
          if (matches.length === 0) return Promise.resolve(null);
          const sorted = [...matches].sort((a, b) =>
            orderBy.seq === 'desc' ? b.seq - a.seq : a.seq - b.seq,
          );
          return Promise.resolve(sorted[0]);
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const entry = { id: `entry-${store.length}`, ...data, createdAt: new Date() };
          store.push(entry);
          return Promise.resolve(entry);
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) =>
          Promise.resolve(
            store
              .filter((e) => e.tenantId === where.tenantId && e.sessionId === where.sessionId)
              .sort((a, b) => a.seq - b.seq),
          ),
        ),
      },
    };
    service = new IntegrityChainService(prisma);
  });

  describe('append', () => {
    it('starts the first entry off the genesis hash at seq 0', async () => {
      const entry = await service.append(tenantId, sessionId, 'proctoring_event', { foo: 'bar' });

      expect(entry.seq).toBe(0);
      expect(entry.prevHash).toBe('0'.repeat(64));
      expect(entry.entryHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('chains each subsequent entry off the previous entryHash, incrementing seq', async () => {
      const first = await service.append(tenantId, sessionId, 'proctoring_event', { a: 1 });
      const second = await service.append(tenantId, sessionId, 'proctor_action', { b: 2 });

      expect(second.seq).toBe(1);
      expect(second.prevHash).toBe(first.entryHash);
    });

    it('produces the same hash regardless of payload key insertion order (stable canonicalization)', async () => {
      const a = await service.append(tenantId, 'sess-a', 'system', { z: 1, a: 2 });
      const b = await service.append(tenantId, 'sess-b', 'system', { a: 2, z: 1 });

      expect(a.entryHash).toBe(b.entryHash);
    });
  });

  describe('getChain', () => {
    it('returns entries scoped to tenant+session in seq order', async () => {
      await service.append(tenantId, sessionId, 'proctoring_event', { a: 1 });
      await service.append(tenantId, sessionId, 'proctor_action', { b: 2 });

      const chain = await service.getChain(tenantId, sessionId);

      expect(chain.map((e: any) => e.seq)).toEqual([0, 1]);
    });
  });

  describe('verify', () => {
    it('reports valid: true for an untampered chain', async () => {
      await service.append(tenantId, sessionId, 'proctoring_event', { a: 1 });
      await service.append(tenantId, sessionId, 'proctor_action', { b: 2 });

      const result = await service.verify(tenantId, sessionId);

      expect(result).toEqual({ valid: true, entries: 2, brokenAtSeq: null });
    });

    it('reports valid: true with zero entries for a session with no chain yet', async () => {
      const result = await service.verify(tenantId, 'sess-empty');

      expect(result).toEqual({ valid: true, entries: 0, brokenAtSeq: null });
    });

    it('detects a tampered payload — recomputed hash no longer matches the stored entryHash', async () => {
      await service.append(tenantId, sessionId, 'proctoring_event', { a: 1 });
      // Tamper: mutate the stored payload after the fact, exactly what verify() must catch.
      store[0].payload = { a: 999 };

      const result = await service.verify(tenantId, sessionId);

      expect(result.valid).toBe(false);
      expect(result.brokenAtSeq).toBe(0);
    });

    it('detects a broken prev-hash link (e.g. an entry deleted from the middle)', async () => {
      await service.append(tenantId, sessionId, 'proctoring_event', { a: 1 });
      await service.append(tenantId, sessionId, 'proctor_action', { b: 2 });
      await service.append(tenantId, sessionId, 'system', { c: 3 });
      // Simulate deletion of the middle entry — seq 1 vanishes, seq 2's prevHash
      // now points at a hash that no longer immediately precedes it in the chain.
      store.splice(1, 1);

      const result = await service.verify(tenantId, sessionId);

      expect(result.valid).toBe(false);
      expect(result.brokenAtSeq).toBe(2);
    });
  });
});
