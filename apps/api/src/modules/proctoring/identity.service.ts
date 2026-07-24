import { Injectable, NotFoundException } from '@nestjs/common';
import { IdentityVerificationStatus, LivenessMode, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProctoringService } from './proctoring.service';

// Acceptance thresholds for the recorded (client/vendor-produced) scores.
const FACE_MATCH_MIN = 0.8; // 1:1 document-vs-live confidence
const DOC_SCORE_MIN = 0.7; // document authenticity confidence

export interface SubmitVerificationInput {
  sessionId?: string;
  documentType?: string;
  documentVerified?: boolean;
  documentScore?: number;
  faceMatchScore?: number;
  livenessPassed?: boolean;
  livenessMode?: LivenessMode;
  otpVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ReverifyInput {
  faceMatchScore?: number;
  livenessPassed?: boolean;
  driftDetected?: boolean;
}

export interface SessionBinding {
  deviceId?: string;
  ipHash?: string;
  biometricHash?: string;
}

/**
 * "Who is taking the test" pillar. Records identity-verification RESULTS
 * produced upstream (client/vendor OCR, 1:1 face match, liveness), computes an
 * overall status against thresholds, gates session start, and drives
 * continuous re-verification + session binding. Every score is retained so an
 * adverse decision is explainable on appeal. The backend performs no CV/OCR
 * itself.
 */
@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proctoring: ProctoringService,
  ) {}

  private computeStatus(v: {
    documentVerified: boolean;
    documentScore?: number | null;
    faceMatchScore?: number | null;
    livenessPassed: boolean;
  }): IdentityVerificationStatus {
    // A confident face-match failure = impostor -> hard fail.
    if (v.faceMatchScore != null && v.faceMatchScore < FACE_MATCH_MIN) return 'failed';
    // Document looks tampered/low-confidence -> human review.
    if (v.documentScore != null && v.documentScore < DOC_SCORE_MIN) return 'manual_review';
    // All primary checks passed.
    if (
      v.documentVerified &&
      v.livenessPassed &&
      v.faceMatchScore != null &&
      v.faceMatchScore >= FACE_MATCH_MIN
    ) {
      return 'verified';
    }
    // Some evidence present but incomplete.
    if (v.documentVerified || v.faceMatchScore != null || v.livenessPassed) {
      return 'manual_review';
    }
    return 'pending';
  }

  async submitVerification(tenantId: string, userId: string, dto: SubmitVerificationInput) {
    const status = this.computeStatus({
      documentVerified: dto.documentVerified ?? false,
      documentScore: dto.documentScore ?? null,
      faceMatchScore: dto.faceMatchScore ?? null,
      livenessPassed: dto.livenessPassed ?? false,
    });

    const record = await this.prisma.identityVerification.create({
      data: {
        tenantId,
        userId,
        sessionId: dto.sessionId,
        documentType: dto.documentType,
        documentVerified: dto.documentVerified ?? false,
        documentScore: dto.documentScore,
        faceMatchScore: dto.faceMatchScore,
        livenessPassed: dto.livenessPassed ?? false,
        livenessMode: dto.livenessMode ?? 'passive',
        otpVerified: dto.otpVerified ?? false,
        status,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
    return record;
  }

  async getLatest(tenantId: string, userId: string, sessionId?: string) {
    return this.prisma.identityVerification.findFirst({
      where: { tenantId, userId, ...(sessionId ? { sessionId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Gate helper: is the taker verified for this session? (assessment-start flow
  // can call this before allowing entry.)
  async isVerifiedForSession(tenantId: string, sessionId: string): Promise<boolean> {
    const latest = await this.prisma.identityVerification.findFirst({
      where: { tenantId, sessionId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    });
    return !!latest;
  }

  // Same gate, but before a session exists to attach the check to — identity
  // verification happens pre-session, so at the moment AssessmentService
  // creates the session there is no sessionId yet for isVerifiedForSession to
  // filter on. Falls back to "has this user verified at all recently".
  async isVerifiedForUser(tenantId: string, userId: string): Promise<boolean> {
    const latest = await this.prisma.identityVerification.findFirst({
      where: { tenantId, userId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    });
    return !!latest;
  }

  // Admin queue: records the automated pipeline couldn't resolve on its own
  // (low document-authenticity confidence, or an ambiguous face match — see
  // computeStatus). Without a human decision here these are a permanent
  // dead end for the candidate, since nothing else moves a record off
  // manual_review.
  async listPendingReview(tenantId: string) {
    return this.prisma.identityVerification.findMany({
      where: { tenantId, status: 'manual_review' },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Human decision on a manual_review record. Recorded in metadata rather
  // than dedicated columns — this is a low-volume admin action, not a
  // reportable field anything else queries.
  async overrideStatus(
    tenantId: string,
    id: string,
    reviewerId: string,
    decision: 'verified' | 'failed',
    note?: string,
  ) {
    const existing = await this.prisma.identityVerification.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Identity verification not found');

    const existingMetadata = (existing.metadata as Record<string, unknown> | null) ?? {};
    return this.prisma.identityVerification.update({
      where: { id },
      data: {
        status: decision,
        metadata: {
          ...existingMetadata,
          reviewedBy: reviewerId,
          reviewedAt: new Date().toISOString(),
          reviewNote: note ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  }

  // In-session periodic re-check. A confirmed drift (different person) both
  // flags the record and raises an identity_drift proctoring event, and revokes
  // the session binding so the client must re-authenticate.
  async reverify(tenantId: string, userId: string, id: string, dto: ReverifyInput) {
    const existing = await this.prisma.identityVerification.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Identity verification not found');

    const drift =
      dto.driftDetected === true ||
      (dto.faceMatchScore != null && dto.faceMatchScore < FACE_MATCH_MIN);

    const updated = await this.prisma.identityVerification.update({
      where: { id },
      data: {
        reverifiedAt: new Date(),
        reverifyCount: { increment: 1 },
        driftDetected: drift || existing.driftDetected,
        ...(dto.faceMatchScore != null ? { faceMatchScore: dto.faceMatchScore } : {}),
        ...(dto.livenessPassed != null ? { livenessPassed: dto.livenessPassed } : {}),
        ...(drift ? { status: 'manual_review' as IdentityVerificationStatus } : {}),
      },
    });

    if (drift && existing.sessionId) {
      await this.proctoring
        .logEvent(tenantId, userId, {
          sessionId: existing.sessionId,
          eventType: 'identity_drift',
          metadata: { verificationId: id, faceMatchScore: dto.faceMatchScore },
        })
        .catch(() => undefined);
      await this.revokeSession(tenantId, existing.sessionId);
    }

    return { verification: updated, driftDetected: drift };
  }

  async bindSession(tenantId: string, sessionId: string, binding: SessionBinding) {
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        deviceId: binding.deviceId,
        ipHash: binding.ipHash,
        biometricHash: binding.biometricHash,
        proctoringRevoked: false,
      },
    });
  }

  // Verify an in-session request still matches the bound device/IP/biometric.
  // Any mismatch revokes the session (continuous-auth anomaly).
  async checkBinding(tenantId: string, sessionId: string, presented: SessionBinding) {
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const mismatches: string[] = [];
    if (session.deviceId && presented.deviceId && session.deviceId !== presented.deviceId) {
      mismatches.push('deviceId');
    }
    if (session.ipHash && presented.ipHash && session.ipHash !== presented.ipHash) {
      mismatches.push('ipHash');
    }
    if (
      session.biometricHash &&
      presented.biometricHash &&
      session.biometricHash !== presented.biometricHash
    ) {
      mismatches.push('biometricHash');
    }

    if (mismatches.length > 0) {
      await this.revokeSession(tenantId, sessionId);
      return { ok: false, revoked: true, mismatches };
    }
    return { ok: true, revoked: session.proctoringRevoked, mismatches };
  }

  async revokeSession(tenantId: string, sessionId: string) {
    return this.prisma.assessmentSession.updateMany({
      where: { id: sessionId, tenantId },
      data: { proctoringRevoked: true },
    });
  }
}
