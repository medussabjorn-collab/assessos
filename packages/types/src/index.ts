// Tenant
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  whiteLabel?: Record<string, any>;
  ssoConfig?: Record<string, any>;
  settings?: Record<string, any>;
  createdAt: Date;
}

// User
export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'employee';

export interface User {
  id: string;
  tenantId: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Assessment
export type SessionStatus = 'pending' | 'active' | 'done';
export type ReportStatus = 'pending' | 'ready' | 'archived';

export interface AssessmentSession {
  id: string;
  tenantId: string;
  userId: string;
  configId: string;
  pillar: string;
  status: SessionStatus;
  startedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
}

export interface AssessmentConfig {
  id: string;
  tenantId: string;
  pillar: string;
  dimensions: Array<{ name: string; weight: number }>;
  timeLimitMin: number;
  passMark: number;
  aiProctoring: boolean;
  benchmarkGroup?: string;
  createdAt: Date;
}

export interface AiReport {
  id: string;
  tenantId: string;
  sessionId: string;
  userId: string;
  dimensionScores: Record<string, number>;
  narrative?: string;
  benchmarkPercentile?: number;
  recommendation?: 'hire' | 'develop' | 'watch';
  coachingPlan?: Record<string, any>;
  status: ReportStatus;
  createdAt: Date;
}

// API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface AuthContext {
  user: User | null;
  tenantId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}
