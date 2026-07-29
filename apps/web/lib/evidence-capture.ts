'use client';

import { api } from './api';

// Mirrors apps/api/src/modules/proctoring/evidence.controller.ts's new
// /capture endpoint (evidence.service.ts's captureAndRecord) — keep in sync.

export type EvidenceType = 'face_cam' | 'room_cam' | 'screen' | 'audio' | 'snapshot' | 'clip' | 'document';

export interface CaptureEvidenceInput {
  sessionId: string;
  type: EvidenceType;
  imageBase64: string; // data URL, e.g. from canvas.toDataURL('image/jpeg')
  eventId?: string;
  metadata?: Record<string, unknown>;
}

export async function captureEvidence(input: CaptureEvidenceInput): Promise<{ id: string; storageRef: string }> {
  const res = await api.post('/api/proctoring/evidence/capture', input);
  return res.data.data;
}
