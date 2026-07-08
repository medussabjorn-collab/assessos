export type UserRole = 'admin' | 'candidate' | 'viewer' | 'recruiter';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja';

export type AssessmentModuleId =
  | 'technical'
  | 'attitude'
  | 'behavioral'
  | 'psychometric'
  | 'communication';

export type ProgrammingLanguage = 'cpp' | 'java' | 'dotnet' | 'python' | 'javascript';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt: string;
  lastLogin?: string;
  lastLoginAt?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface Question {
  id: string;
  moduleId: AssessmentModuleId;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  codeSnippet?: string;
  language?: ProgrammingLanguage;
  points: number;
}

export interface AssessmentConfig {
  id: string;
  moduleId: AssessmentModuleId;
  title: string;
  description: string;
  totalQuestions: number;
  timeLimit: number; // minutes
  passingScore: number; // percentage
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  proctoring: boolean;
  offlineMode: boolean;
  availableLanguages: ProgrammingLanguage[];
  pointsPerQuestion: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  configId: string;
  moduleId: AssessmentModuleId;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, number>; // questionId -> selectedIndex
  flaggedQuestions: string[];
  timeSpent: number; // seconds
  score?: number;
  percentage?: number;
  passed?: boolean;
  proctorEvents: ProctoringEvent[];
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  offlineData?: boolean;
}

export interface ProctoringEvent {
  id: string;
  timestamp: string;
  type: 'warning' | 'violation' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high';
  snapshot?: string; // base64
}

export interface PerformanceReport {
  userId: string;
  sessions: AssessmentSession[];
  moduleScores: Record<AssessmentModuleId, number>;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  timeAnalysis: { module: AssessmentModuleId; avgTime: number }[];
  weakAreas: string[];
  strengthAreas: string[];
  recommendations: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'score-summary' | 'progress-chart' | 'recent-activity' | 'leaderboard' | 'upcoming' | 'quick-stats';
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  userId: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
