import { Request } from 'express';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'candidate' | 'viewer' | 'recruiter';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type AssessmentModuleId =
  | 'technical'
  | 'attitude'
  | 'behavioral'
  | 'psychometric'
  | 'communication';

export type SessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'expired';

// ─── Questions (MongoDB) ──────────────────────────────────────────────────────

export interface QuestionOption {
  index: number;
  text: string;
}

export interface IQuestion {
  _id?: string;
  moduleId: AssessmentModuleId;
  text: string;
  options: QuestionOption[];
  correctIndex: number;
  explanation?: string;
  difficulty: number;       // IRT b param: -3 to +3
  discrimination: number;   // IRT a param: 0.5 to 3
  guessing: number;         // IRT c param: 0 to 0.35
  subTopic?: string;
  tags?: string[];
  language?: string;
  codeSnippet?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── IRT ──────────────────────────────────────────────────────────────────────

export interface IrtAbility {
  theta: number;
  se: number;
  tier: 'Expert' | 'Proficient' | 'Competent' | 'Developing' | 'Novice';
}

export interface IrtParams {
  a: number; // discrimination
  b: number; // difficulty
  c: number; // guessing
}

// ─── Proctoring ───────────────────────────────────────────────────────────────

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
  | 'screen_switch';

export interface ProctoringEventPayload {
  sessionId: string;
  eventType: ProctoringEventType;
  metadata?: Record<string, unknown>;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface SubTopicScore {
  topic: string;
  correct: number;
  total: number;
  percent: number;
}

export interface PerformanceReport {
  userId: string;
  moduleId: AssessmentModuleId;
  score: number;
  passed: boolean;
  irtTheta: number;
  irtTier: string;
  subTopicScores: SubTopicScore[];
  aiInsights: string[];
  proctoringRisk: number;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
