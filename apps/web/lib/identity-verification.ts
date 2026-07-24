'use client';

import { api } from './api';

// Mirrors apps/api/src/modules/proctoring/identity.controller.ts +
// identity.service.ts — keep in sync. The backend performs no CV/OCR itself;
// these calls submit results produced upstream (client SDK / vendor).

export type IdentityVerificationStatus = 'pending' | 'verified' | 'failed' | 'manual_review';
export type LivenessMode = 'passive' | 'active';

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

export interface IdentityVerificationRecord {
  id: string;
  tenantId: string;
  userId: string;
  sessionId: string | null;
  documentType: string | null;
  documentVerified: boolean;
  documentScore: number | null;
  faceMatchScore: number | null;
  livenessPassed: boolean;
  livenessMode: LivenessMode;
  otpVerified: boolean;
  status: IdentityVerificationStatus;
  reverifiedAt: string | null;
  reverifyCount: number;
  driftDetected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReverifyInput {
  faceMatchScore?: number;
  livenessPassed?: boolean;
  driftDetected?: boolean;
}

export interface ReverifyResult {
  verification: IdentityVerificationRecord;
  driftDetected: boolean;
}

export interface SessionBinding {
  deviceId?: string;
  ipHash?: string;
  biometricHash?: string;
}

export interface CheckBindingResult {
  ok: boolean;
  revoked: boolean;
  mismatches: string[];
}

// Pre-session: submit document/face/liveness/OTP verification results.
export async function submitVerification(
  input: SubmitVerificationInput,
): Promise<IdentityVerificationRecord> {
  const res = await api.post('/api/proctoring/identity/verify', input);
  return res.data.data;
}

// Latest verification record for the current user, optionally scoped to a session.
export async function getVerificationStatus(
  sessionId?: string,
): Promise<IdentityVerificationRecord | null> {
  const res = await api.get('/api/proctoring/identity/status', {
    params: sessionId ? { sessionId } : undefined,
  });
  return res.data.data;
}

// Gate check: has this exact session been verified? (session already exists)
export async function isSessionVerified(sessionId: string): Promise<boolean> {
  const res = await api.get(`/api/proctoring/identity/session/${sessionId}/verified`);
  return res.data.data.verified;
}

// In-session continuous re-verification. A confirmed drift both flags the
// record and revokes the session binding server-side.
export async function reverify(
  verificationId: string,
  input: ReverifyInput,
): Promise<ReverifyResult> {
  const res = await api.post(`/api/proctoring/identity/${verificationId}/reverify`, input);
  return res.data.data;
}

// Bind a session to a device/IP-hash/biometric-hash for continuous auth.
export async function bindSession(
  sessionId: string,
  binding: SessionBinding,
): Promise<{ id: string; bound: boolean }> {
  const res = await api.post(`/api/proctoring/identity/session/${sessionId}/bind`, binding);
  return res.data.data;
}

// Re-check the bound device/IP/biometric mid-session. Any mismatch revokes
// the session server-side (AssessmentService then rejects further submits).
export async function checkBinding(
  sessionId: string,
  presented: SessionBinding,
): Promise<CheckBindingResult> {
  const res = await api.post(
    `/api/proctoring/identity/session/${sessionId}/check-binding`,
    presented,
  );
  return res.data.data;
}

// Admin queue — requires proctoring.incidents.review.
export async function listPendingReview(): Promise<IdentityVerificationRecord[]> {
  const res = await api.get('/api/proctoring/identity/pending-review');
  return res.data.data;
}

export async function overrideVerification(
  id: string,
  decision: 'verified' | 'failed',
  note?: string,
): Promise<IdentityVerificationRecord> {
  const res = await api.post(`/api/proctoring/identity/${id}/override`, { decision, note });
  return res.data.data;
}
