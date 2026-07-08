/**
 * Real-time Risk Scoring Engine for AI Proctoring
 * Implements weighted event accumulation with decay and threshold alerting.
 */
import type { ProctoringEvent } from '../types';

export type RiskCategory = 'safe' | 'warning' | 'critical';

export interface RiskEvent {
  type:      string;
  score:     number;
  timestamp: number;
  decay:     number;   // half-life in seconds
  message:   string;
}

export interface RiskState {
  totalScore:  number;
  category:    RiskCategory;
  events:      RiskEvent[];
  violations:  number;
  warnings:    number;
  lastUpdated: number;
}

/** Risk weights per event type */
export const RISK_WEIGHTS: Record<string, { score: number; decay: number; message: string }> = {
  face_not_detected:    { score: 30, decay: 60,  message: 'No face detected in frame' },
  multiple_faces:       { score: 50, decay: 120, message: 'Multiple faces detected' },
  looking_away:         { score: 10, decay: 30,  message: 'Candidate not looking at screen' },
  suspicious_object:    { score: 40, decay: 180, message: 'Suspicious object detected (phone/book)' },
  tab_switch:           { score: 15, decay: 90,  message: 'Browser tab switch detected' },
  fullscreen_exit:      { score: 20, decay: 60,  message: 'Fullscreen mode exited' },
  keyboard_inactivity:  { score: 5,  decay: 120, message: 'Extended keyboard inactivity' },
  audio_detected:       { score: 20, decay: 90,  message: 'Background audio detected' },
  vpn_detected:         { score: 35, decay: 600, message: 'VPN/proxy connection suspected' },
  copy_paste:           { score: 25, decay: 60,  message: 'Copy-paste action detected' },
  window_blur:          { score: 8,  decay: 45,  message: 'Window lost focus' },
  screen_switch:        { score: 25, decay: 120, message: 'Window moved to another screen' },
};

const THRESHOLDS = { warning: 30, critical: 70 };

class RiskScoringEngine {
  private state: RiskState = {
    totalScore: 0,
    category: 'safe',
    events: [],
    violations: 0,
    warnings: 0,
    lastUpdated: Date.now(),
  };

  private listeners: ((state: RiskState) => void)[] = [];

  subscribe(fn: (state: RiskState) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit() {
    this.listeners.forEach(l => l(this.getState()));
  }

  /** Apply exponential decay to all existing events */
  private decayEvents(): void {
    const now = Date.now() / 1000;
    this.state.events = this.state.events.map(e => {
      const ageSeconds = (now - e.timestamp / 1000);
      const decayedScore = e.score * Math.pow(0.5, ageSeconds / e.decay);
      return { ...e, score: Math.max(0, decayedScore) };
    }).filter(e => e.score > 0.5); // prune negligible events
  }

  /** Add a risk event and recalculate score */
  addEvent(type: string, customScore?: number): RiskState {
    const def = RISK_WEIGHTS[type];
    if (!def && customScore === undefined) return this.getState();

    this.decayEvents();

    const event: RiskEvent = {
      type,
      score:     customScore ?? def.score,
      timestamp: Date.now(),
      decay:     def?.decay ?? 60,
      message:   def?.message ?? type,
    };

    this.state.events.push(event);
    this.recalculate();
    this.emit();
    return this.getState();
  }

  private recalculate(): void {
    const total = this.state.events.reduce((s, e) => s + e.score, 0);
    this.state.totalScore = Math.round(Math.min(100, total));

    const prev = this.state.category;
    if (total >= THRESHOLDS.critical) {
      this.state.category = 'critical';
      if (prev !== 'critical') this.state.violations++;
    } else if (total >= THRESHOLDS.warning) {
      this.state.category = 'warning';
      if (prev === 'safe') this.state.warnings++;
    } else {
      this.state.category = 'safe';
    }

    this.state.lastUpdated = Date.now();
  }

  getState(): RiskState {
    this.decayEvents();
    this.recalculate();
    return { ...this.state, events: [...this.state.events] };
  }

  reset(): void {
    this.state = { totalScore: 0, category: 'safe', events: [], violations: 0, warnings: 0, lastUpdated: Date.now() };
    this.emit();
  }

  /** Convert risk state to ProctoringEvent for storage */
  toProctoringEvent(event: RiskEvent): Omit<ProctoringEvent, 'id' | 'timestamp'> {
    const state = this.getState();
    return {
      type:     state.category === 'critical' ? 'violation' : 'warning',
      message:  event.message,
      severity: state.category === 'critical' ? 'high' : state.category === 'warning' ? 'medium' : 'low',
    };
  }

  /** Generate AI summary from session events */
  generateSummary(): string {
    const state = this.getState();
    const counts: Record<string, number> = {};
    for (const e of state.events) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }

    const parts: string[] = [];
    if (counts.looking_away)     parts.push(`looked away ${counts.looking_away} time(s)`);
    if (counts.tab_switch)       parts.push(`switched tabs ${counts.tab_switch} time(s)`);
    if (counts.multiple_faces)   parts.push(`multiple faces detected ${counts.multiple_faces} time(s)`);
    if (counts.suspicious_object) parts.push(`suspicious object detected ${counts.suspicious_object} time(s)`);
    if (counts.face_not_detected) parts.push(`face not detected ${counts.face_not_detected} time(s)`);

    if (parts.length === 0) return 'No integrity violations detected. Assessment completed normally.';
    return `Candidate ${parts.join(', ')}. Risk score: ${state.totalScore}/100. Violations: ${state.violations}.`;
  }
}

export const riskEngine = new RiskScoringEngine();
