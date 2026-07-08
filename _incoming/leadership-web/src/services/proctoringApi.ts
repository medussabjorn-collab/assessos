import { api } from './apiClient';

export type ProctoringEventType =
  | 'face_not_detected'
  | 'multiple_faces'
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste'
  | 'right_click'
  | 'devtools_open'
  | 'phone_detected'
  | 'gaze_deviation'
  | 'audio_detected'
  | 'screen_switch'
  | 'fullscreen_exit'
  | 'looking_away'
  | 'safe';

export interface ProctoringEventPayload {
  sessionId: string;
  eventType: ProctoringEventType;
  metadata?: Record<string, unknown>;
}

export interface ProctoringReport {
  data: {
    sessionId: string;
    totalEvents: number;
    currentRisk: number;
    riskLevel: 'safe' | 'warning' | 'critical';
    violations: number;
    warnings: number;
    byType: Record<string, number>;
    peakRisk: number;
    events: Array<{
      eventType: string;
      riskDelta: number;
      totalRisk: number;
      occurredAt: string;
    }>;
  };
}

export const proctoringApi = {
  logEvent: (payload: ProctoringEventPayload) =>
    api.post('/proctoring/event', payload),

  getReport: (sessionId: string) =>
    api.get<ProctoringReport>(`/proctoring/report/${sessionId}`),
};
