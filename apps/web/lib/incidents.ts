'use client';

import { api } from './api';

// Mirrors apps/api/src/modules/proctoring/incident.controller.ts +
// incident.service.ts — keep in sync.

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type IncidentResolution =
  | 'no_action'
  | 'warning_issued'
  | 'result_flagged'
  | 'result_cancelled'
  | 'candidate_banned';
export type AppealStatus = 'none' | 'requested' | 'upheld' | 'overturned';

export interface ProctoringIncident {
  id: string;
  tenantId: string;
  sessionId: string;
  userId: string;
  category: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  riskScore: number | null;
  description: string | null;
  openedBy: string;
  assignedTo: string | null;
  slaDueAt: string | null;
  resolution: IncidentResolution | null;
  resolutionNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  appealStatus: AppealStatus;
  appealReason: string | null;
  appealResolvedById: string | null;
  appealResolvedAt: string | null;
  appealNote: string | null;
  createdAt: string;
}

export interface EvidenceExport {
  incident: ProctoringIncident;
  integrity: { valid: boolean; entries: number; brokenAtSeq: number | null };
  counts: {
    events: number;
    evidence: number;
    identityChecks: number;
    environmentScans: number;
    chainEntries: number;
  };
  events: unknown[];
  evidence: unknown[];
  identity: unknown[];
  environmentScans: unknown[];
  chain: unknown[];
}

export async function listIncidents(filters?: {
  status?: string;
  severity?: string;
  sessionId?: string;
}): Promise<ProctoringIncident[]> {
  const res = await api.get('/api/proctoring/incidents', { params: filters });
  return res.data.data;
}

export async function getIncident(id: string): Promise<ProctoringIncident> {
  const res = await api.get(`/api/proctoring/incidents/${id}`);
  return res.data.data;
}

export async function assignIncident(id: string, assignedTo: string): Promise<ProctoringIncident> {
  const res = await api.post(`/api/proctoring/incidents/${id}/assign`, { assignedTo });
  return res.data.data;
}

export async function reviewIncident(
  id: string,
  input: { resolution: IncidentResolution; note?: string; dismiss?: boolean },
): Promise<ProctoringIncident> {
  const res = await api.post(`/api/proctoring/incidents/${id}/review`, input);
  return res.data.data;
}

export async function resolveAppeal(
  id: string,
  outcome: 'upheld' | 'overturned',
  note?: string,
): Promise<ProctoringIncident> {
  const res = await api.post(`/api/proctoring/incidents/${id}/appeal/resolve`, { outcome, note });
  return res.data.data;
}

export async function getEvidenceExport(id: string): Promise<EvidenceExport> {
  const res = await api.get(`/api/proctoring/incidents/${id}/evidence-export`);
  return res.data.data;
}
