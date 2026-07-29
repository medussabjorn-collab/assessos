'use client';

import { api } from './api';

// Mirrors apps/api/src/modules/proctoring/environment.controller.ts +
// environment.service.ts — keep in sync.

export type EnvironmentScanStatus = 'pending' | 'clear' | 'flagged' | 'blocked';

export interface SubmitScanInput {
  sessionId?: string;
  configId?: string;
  scanType?: string;
  personsDetected?: number;
  monitorsDetected?: number;
  phoneDetected?: boolean;
  notesDetected?: boolean;
  whiteboardDetected?: boolean;
  lightingOk?: boolean;
  faceVisible?: boolean;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentScan {
  id: string;
  status: EnvironmentScanStatus;
  findings: string[];
  personsDetected: number;
  monitorsDetected: number;
  createdAt: string;
}

export async function submitEnvironmentScan(input: SubmitScanInput): Promise<EnvironmentScan> {
  const res = await api.post('/api/proctoring/environment/scan', input);
  return res.data.data;
}
