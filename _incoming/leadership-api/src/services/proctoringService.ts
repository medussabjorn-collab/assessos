import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ProctoringEventType, ProctoringEventPayload } from '../types';

const RISK_WEIGHTS: Record<ProctoringEventType, { score: number; decayHalfLife: number }> = {
  face_not_detected:  { score: 30, decayHalfLife: 120 },
  multiple_faces:     { score: 50, decayHalfLife: 180 },
  looking_away:       { score: 10, decayHalfLife:  60 },
  suspicious_object:  { score: 40, decayHalfLife: 300 },
  tab_switch:         { score: 15, decayHalfLife:  90 },
  window_blur:        { score: 10, decayHalfLife:  60 },
  fullscreen_exit:    { score: 20, decayHalfLife: 120 },
  copy_paste:         { score: 25, decayHalfLife: 120 },
  vpn_detected:       { score: 35, decayHalfLife: 600 },
  audio_detected:     { score: 20, decayHalfLife:  90 },
  phone_detected:     { score: 40, decayHalfLife: 240 },
  screen_switch:      { score: 25, decayHalfLife: 120 },
};

export const RISK_THRESHOLD_WARNING  = 30;
export const RISK_THRESHOLD_CRITICAL = 70;

export async function logProctoringEvent(
  payload: ProctoringEventPayload,
  userId: string
): Promise<{ totalRisk: number; level: 'safe' | 'warning' | 'critical' }> {
  const session = await prisma.assessmentSession.findFirst({
    where: { id: payload.sessionId, userId, status: 'in_progress' },
  });
  if (!session) throw new AppError(404, 'Active session not found');

  const weight = RISK_WEIGHTS[payload.eventType] ?? { score: 5, decayHalfLife: 60 };

  // Compute current total risk from recent events with exponential decay
  const recentEvents = await prisma.proctoringEventLog.findMany({
    where: { sessionId: payload.sessionId },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  });

  let totalRisk = 0;
  const now = Date.now();
  for (const evt of recentEvents) {
    const w = RISK_WEIGHTS[evt.eventType as ProctoringEventType];
    if (!w) continue;
    const ageSec = (now - new Date(evt.occurredAt).getTime()) / 1000;
    totalRisk += w.score * Math.pow(0.5, ageSec / w.decayHalfLife);
  }

  // Add new event score
  totalRisk = Math.min(100, Math.round(totalRisk + weight.score));

  await prisma.proctoringEventLog.create({
    data: {
      sessionId: payload.sessionId,
      eventType: payload.eventType,
      riskDelta:  weight.score,
      totalRisk,
      metadata:  (payload.metadata as import('@prisma/client').Prisma.InputJsonValue) ?? undefined,
    },
  });

  const level: 'safe' | 'warning' | 'critical' =
    totalRisk >= RISK_THRESHOLD_CRITICAL ? 'critical' :
    totalRisk >= RISK_THRESHOLD_WARNING  ? 'warning'  : 'safe';

  return { totalRisk, level };
}

export async function getProctoringReport(sessionId: string) {
  const events = await prisma.proctoringEventLog.findMany({
    where: { sessionId },
    orderBy: { occurredAt: 'asc' },
  });

  const byType: Record<string, number> = {};
  for (const evt of events) {
    byType[evt.eventType] = (byType[evt.eventType] ?? 0) + 1;
  }

  const violations = events.filter(e => {
    const w = RISK_WEIGHTS[e.eventType as ProctoringEventType];
    return w && w.score >= 30;
  }).length;

  const warnings = events.filter(e => {
    const w = RISK_WEIGHTS[e.eventType as ProctoringEventType];
    return w && w.score >= 10 && w.score < 30;
  }).length;

  const peakRisk = events.reduce((max, e) => Math.max(max, e.totalRisk), 0);

  return { events, byType, violations, warnings, peakRisk, totalEvents: events.length };
}
