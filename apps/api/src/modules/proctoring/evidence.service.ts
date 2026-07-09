import { Injectable } from '@nestjs/common';
import { EvidenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IntegrityChainService } from './integrity-chain.service';

export interface RecordEvidenceInput {
  sessionId: string;
  type: EvidenceType;
  storageRef: string;
  contentHash: string;
  eventId?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSec?: number;
  metadata?: Record<string, unknown>;
}

/**
 * "How do you prove it" pillar (evidence half). Records references to captured
 * evidence (blobs live in encrypted object storage) with a content hash, and
 * commits each capture into the per-session tamper-evident integrity chain.
 */
@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: IntegrityChainService,
  ) {}

  async record(tenantId: string, input: RecordEvidenceInput) {
    const artifact = await this.prisma.evidenceArtifact.create({
      data: {
        tenantId,
        sessionId: input.sessionId,
        eventId: input.eventId,
        type: input.type,
        storageRef: input.storageRef,
        contentHash: input.contentHash,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        durationSec: input.durationSec,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    await this.chain.append(tenantId, input.sessionId, 'evidence_captured', {
      artifactId: artifact.id,
      type: artifact.type,
      contentHash: artifact.contentHash,
      storageRef: artifact.storageRef,
    });

    return artifact;
  }

  async list(tenantId: string, sessionId: string) {
    return this.prisma.evidenceArtifact.findMany({
      where: { tenantId, sessionId },
      orderBy: { capturedAt: 'asc' },
    });
  }
}
