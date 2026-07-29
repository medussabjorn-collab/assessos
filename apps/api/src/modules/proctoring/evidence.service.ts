import { BadRequestException, Injectable } from '@nestjs/common';
import { EvidenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IntegrityChainService } from './integrity-chain.service';
import { StorageService } from './storage.service';

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

export interface CaptureEvidenceInput {
  sessionId: string;
  type: EvidenceType;
  imageBase64: string; // data URL or raw base64 — see stripDataUrlPrefix
  eventId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — a snapshot frame, not a video

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
    private readonly storage: StorageService,
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

  // Real capture pipeline: previously `record()` was the only entry point,
  // trusting a storageRef/contentHash the caller already computed — nothing
  // in the client ever actually uploaded an artifact anywhere, so this was
  // dead in practice. This decodes and uploads the actual bytes, computing
  // contentHash server-side from what was really uploaded (not caller-
  // supplied), then delegates to record() for the DB row + chain entry.
  async captureAndRecord(tenantId: string, input: CaptureEvidenceInput) {
    if (!this.storage.ready) {
      throw new BadRequestException('Evidence capture storage is not configured for this tenant');
    }

    const { mimeType, buffer } = this.decodeImage(input.imageBase64);
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Evidence image exceeds the 5MB size limit');
    }

    const { storageRef, contentHash, sizeBytes } = await this.storage.upload(
      tenantId, input.sessionId, buffer, mimeType,
    );

    return this.record(tenantId, {
      sessionId: input.sessionId,
      type: input.type,
      storageRef,
      contentHash,
      mimeType,
      sizeBytes,
      eventId: input.eventId,
      metadata: input.metadata,
    });
  }

  // Accepts either a data URL ("data:image/jpeg;base64,...") or raw base64.
  private decodeImage(imageBase64: string): { mimeType: string; buffer: Buffer } {
    const match = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(imageBase64);
    if (match) {
      return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      throw new BadRequestException('imageBase64 must be a data URL or raw base64 string');
    }
    return { mimeType: 'image/jpeg', buffer: Buffer.from(imageBase64, 'base64') };
  }
}
