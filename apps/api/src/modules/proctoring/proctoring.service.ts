import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IntegrityChainService } from './integrity-chain.service';

// Unified proctoring — merges the two implementations:
//   - leadership: the strong core — per-event risk weights + exponential
//     time-decay, cumulative risk, ProctoringEventLog persistence, safe/
//     warning/critical levels, aggregate report.
//   - assessos: integrityScore, cheatingRisk band, actionable recommendations,
//     and the extra event types (unusual_movement, low_lighting).
// Detection itself is client-side (face-api in the web app) — the backend is
// the scoring, persistence, and alerting layer. Events arrive via POST.
export type ProctoringEventType =
  | 'face_not_detected'
  | 'multiple_faces'
  | 'looking_away'
  | 'suspicious_object'
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'copy_paste'
  | 'vpn_detected'
  | 'audio_detected'
  | 'phone_detected'
  | 'screen_switch'
  // merged in from assessos
  | 'unusual_movement'
  | 'low_lighting'
  // advanced taxonomy — identity & continuous auth
  | 'identity_drift'
  | 'impostor_suspected'
  | 'liveness_failed'
  // advanced taxonomy — environment & device
  | 'extra_person'
  | 'extra_monitor'
  | 'notes_detected'
  | 'book_detected'
  | 'earpiece_detected'
  | 'smartwatch_detected'
  | 'remote_desktop'
  | 'vm_detected'
  | 'screen_share'
  | 'proxy_or_tor'
  // advanced taxonomy — behavior & content
  | 'gaze_off_screen'
  | 'head_pose_anomaly'
  | 'second_voice'
  | 'keystroke_anomaly'
  | 'paste_detected'
  | 'rapid_answer_switching';

interface RiskWeight {
  score: number;
  decayHalfLife: number; // seconds
}

const RISK_WEIGHTS: Record<ProctoringEventType, RiskWeight> = {
  face_not_detected: { score: 30, decayHalfLife: 120 },
  multiple_faces: { score: 50, decayHalfLife: 180 },
  looking_away: { score: 10, decayHalfLife: 60 },
  suspicious_object: { score: 40, decayHalfLife: 300 },
  tab_switch: { score: 15, decayHalfLife: 90 },
  window_blur: { score: 10, decayHalfLife: 60 },
  fullscreen_exit: { score: 20, decayHalfLife: 120 },
  copy_paste: { score: 25, decayHalfLife: 120 },
  vpn_detected: { score: 35, decayHalfLife: 600 },
  audio_detected: { score: 20, decayHalfLife: 90 },
  phone_detected: { score: 40, decayHalfLife: 240 },
  screen_switch: { score: 25, decayHalfLife: 120 },
  unusual_movement: { score: 20, decayHalfLife: 90 },
  low_lighting: { score: 10, decayHalfLife: 60 },
  // identity & continuous auth — high weight, slow decay (integrity-critical)
  identity_drift: { score: 60, decayHalfLife: 600 },
  impostor_suspected: { score: 70, decayHalfLife: 600 },
  liveness_failed: { score: 50, decayHalfLife: 300 },
  // environment & device
  extra_person: { score: 50, decayHalfLife: 180 },
  extra_monitor: { score: 35, decayHalfLife: 300 },
  notes_detected: { score: 30, decayHalfLife: 300 },
  book_detected: { score: 30, decayHalfLife: 300 },
  earpiece_detected: { score: 45, decayHalfLife: 300 },
  smartwatch_detected: { score: 35, decayHalfLife: 300 },
  remote_desktop: { score: 60, decayHalfLife: 600 },
  vm_detected: { score: 50, decayHalfLife: 600 },
  screen_share: { score: 45, decayHalfLife: 300 },
  proxy_or_tor: { score: 35, decayHalfLife: 600 },
  // behavior & content
  gaze_off_screen: { score: 15, decayHalfLife: 60 },
  head_pose_anomaly: { score: 15, decayHalfLife: 60 },
  second_voice: { score: 45, decayHalfLife: 180 },
  keystroke_anomaly: { score: 15, decayHalfLife: 120 },
  paste_detected: { score: 25, decayHalfLife: 120 },
  rapid_answer_switching: { score: 10, decayHalfLife: 90 },
};

const RISK_THRESHOLD_WARNING = 30;
const RISK_THRESHOLD_CRITICAL = 70;

export interface ProctoringEventInput {
  sessionId: string;
  eventType: ProctoringEventType;
  metadata?: Record<string, unknown>;
}

export type RiskLevel = 'safe' | 'warning' | 'critical';
export type CheatingRisk = 'low' | 'medium' | 'high';

@Injectable()
export class ProctoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly chain: IntegrityChainService,
  ) {}

  private levelOf(risk: number): RiskLevel {
    if (risk >= RISK_THRESHOLD_CRITICAL) return 'critical';
    if (risk >= RISK_THRESHOLD_WARNING) return 'warning';
    return 'safe';
  }

  async logEvent(tenantId: string, userId: string, input: ProctoringEventInput) {
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: input.sessionId, tenantId },
    });
    if (!session || session.status === 'done') {
      throw new NotFoundException('Active assessment session not found');
    }

    const weight = RISK_WEIGHTS[input.eventType] ?? { score: 5, decayHalfLife: 60 };

    // Cumulative risk = decayed sum of recent events + this event's score.
    const recent = await this.prisma.proctoringEventLog.findMany({
      where: { sessionId: input.sessionId },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });
    const now = Date.now();
    let totalRisk = 0;
    for (const evt of recent) {
      const w = RISK_WEIGHTS[evt.eventType as ProctoringEventType];
      if (!w) continue;
      const ageSec = (now - new Date(evt.occurredAt).getTime()) / 1000;
      totalRisk += w.score * Math.pow(0.5, ageSec / w.decayHalfLife);
    }
    totalRisk = Math.min(100, Math.round(totalRisk + weight.score));

    await this.prisma.proctoringEventLog.create({
      data: {
        tenantId,
        sessionId: input.sessionId,
        eventType: input.eventType,
        riskDelta: weight.score,
        totalRisk,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    const level = this.levelOf(totalRisk);

    // Commit the event into the per-session tamper-evident integrity chain.
    await this.chain
      .append(tenantId, input.sessionId, 'proctoring_event', {
        eventType: input.eventType,
        riskDelta: weight.score,
        totalRisk,
        level,
      })
      .catch(() => undefined);

    if (level !== 'safe') {
      // Fire-and-forget alert; pushes live via the realtime gateway.
      void this.notifications
        .notifyProctoringAlert(tenantId, userId, input.sessionId, input.eventType, totalRisk)
        .catch(() => undefined);
    }

    return { totalRisk, level };
  }

  async getReport(sessionId: string, tenantId?: string) {
    const events = await this.prisma.proctoringEventLog.findMany({
      where: { sessionId, ...(tenantId ? { tenantId } : {}) },
      orderBy: { occurredAt: 'asc' },
    });

    const byType: Record<string, number> = {};
    for (const evt of events) byType[evt.eventType] = (byType[evt.eventType] ?? 0) + 1;

    const violations = events.filter((e) => {
      const w = RISK_WEIGHTS[e.eventType as ProctoringEventType];
      return w && w.score >= 30;
    }).length;
    const warnings = events.filter((e) => {
      const w = RISK_WEIGHTS[e.eventType as ProctoringEventType];
      return w && w.score >= 10 && w.score < 30;
    }).length;
    const peakRisk = events.reduce((max, e) => Math.max(max, e.totalRisk), 0);

    // assessos-derived summary fields
    const integrityScore = Math.max(0, 100 - peakRisk);
    const cheatingRisk: CheatingRisk =
      peakRisk >= RISK_THRESHOLD_CRITICAL ? 'high' : peakRisk >= RISK_THRESHOLD_WARNING ? 'medium' : 'low';
    const recommendations: string[] = [];
    if (cheatingRisk === 'high') {
      recommendations.push('Flag for manual review');
      recommendations.push('Corroborate with recording before any adverse decision');
    } else if (cheatingRisk === 'medium') {
      recommendations.push('Review flagged events before finalizing the result');
    }

    return {
      sessionId,
      totalEvents: events.length,
      byType,
      violations,
      warnings,
      peakRisk,
      integrityScore,
      cheatingRisk,
      recommendations,
      events,
    };
  }

  // ── Compatibility surface for the interviews live-interview flow ──────────
  // (assessos ProctoringService API). Detection is client-side; these are
  // lifecycle no-ops kept so the interview flow's contract is unchanged.
  async monitorSession(_sessionId: string) {
    return { monitoringStarted: true };
  }

  async generateProctoringReport(sessionId: string, _alerts?: unknown[]) {
    return this.getReport(sessionId);
  }

  async allowlistApplication(
    _sessionId: string,
    _environment: { osType: string; browserType: string },
  ): Promise<void> {
    // Fair-testing allowlist hook (assessos concept) — enforcement is
    // client-side lockdown; recorded here for future server-side policy.
  }
}
