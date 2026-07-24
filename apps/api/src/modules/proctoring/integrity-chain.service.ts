import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const GENESIS_HASH = '0'.repeat(64);

export type IntegrityEntryType =
  | 'proctoring_event'
  | 'evidence_captured'
  | 'proctor_action'
  | 'identity_check'
  | 'scan'
  | 'system';

// Deterministic JSON: keys sorted recursively so the hash is stable regardless
// of property insertion order.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/**
 * Per-session append-only hash chain. Each entry commits to the previous one:
 *   entryHash = SHA-256( seq | entryType | prevHash | canonical(payload) )
 * Tampering with (or deleting) any entry breaks every subsequent hash, so the
 * evidence/decision trail is verifiable for appeals. Distinct from AuditLog.
 */
@Injectable()
export class IntegrityChainService {
  constructor(private readonly prisma: PrismaService) {}

  private computeHash(seq: number, entryType: string, prevHash: string, payload: unknown): string {
    return createHash('sha256')
      .update(`${seq}|${entryType}|${prevHash}|${stableStringify(payload)}`)
      .digest('hex');
  }

  async append(
    tenantId: string,
    sessionId: string,
    entryType: IntegrityEntryType,
    payload: Record<string, unknown>,
  ) {
    // Retry a couple of times on the seq unique-constraint race.
    for (let attempt = 0; attempt < 3; attempt++) {
      const last = await this.prisma.integrityLogEntry.findFirst({
        where: { sessionId },
        orderBy: { seq: 'desc' },
      });
      const seq = last ? last.seq + 1 : 0;
      const prevHash = last ? last.entryHash : GENESIS_HASH;
      const entryHash = this.computeHash(seq, entryType, prevHash, payload);
      try {
        return await this.prisma.integrityLogEntry.create({
          data: {
            tenantId,
            sessionId,
            seq,
            entryType,
            payload: payload as Prisma.InputJsonValue,
            prevHash,
            entryHash,
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 2) continue; // seq taken, retry
        throw err;
      }
    }
    throw new Error('Failed to append integrity entry after retries');
  }

  async getChain(tenantId: string, sessionId: string) {
    return this.prisma.integrityLogEntry.findMany({
      where: { tenantId, sessionId },
      orderBy: { seq: 'asc' },
    });
  }

  // Recompute the whole chain and confirm each link. Returns the first seq that
  // fails (hash mismatch or broken prev-link), or null if intact.
  async verify(tenantId: string, sessionId: string) {
    const entries = await this.getChain(tenantId, sessionId);
    let expectedPrev = GENESIS_HASH;
    for (const e of entries) {
      const recomputed = this.computeHash(e.seq, e.entryType, e.prevHash, e.payload);
      if (e.prevHash !== expectedPrev || recomputed !== e.entryHash) {
        return { valid: false, entries: entries.length, brokenAtSeq: e.seq };
      }
      expectedPrev = e.entryHash;
    }
    return { valid: true, entries: entries.length, brokenAtSeq: null as number | null };
  }
}
