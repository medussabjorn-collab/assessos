import { Injectable, NotFoundException } from '@nestjs/common';
import { IncidentResolution, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IntegrityChainService } from './integrity-chain.service';

// Default severity per incident category (proctoring taxonomy). Anything not
// listed is 'low'.
const SEVERITY_BY_CATEGORY: Record<string, IncidentSeverity> = {
  impostor_suspected: 'critical',
  identity_drift: 'critical',
  remote_desktop: 'critical',
  multiple_faces: 'high',
  extra_person: 'high',
  phone_detected: 'high',
  earpiece_detected: 'high',
  vm_detected: 'high',
  screen_share: 'high',
  second_voice: 'high',
  liveness_failed: 'high',
  face_not_detected: 'medium',
  suspicious_object: 'medium',
  notes_detected: 'medium',
  book_detected: 'medium',
  extra_monitor: 'medium',
  copy_paste: 'medium',
  paste_detected: 'medium',
  proxy_or_tor: 'medium',
  fullscreen_exit: 'medium',
  screen_switch: 'medium',
};

// Review SLA (hours) per severity.
const SLA_HOURS: Record<IncidentSeverity, number> = {
  critical: 1,
  high: 4,
  medium: 24,
  low: 72,
};

export interface OpenIncidentInput {
  sessionId: string;
  userId: string;
  category: string;
  severity?: IncidentSeverity;
  description?: string;
  riskScore?: number;
  openedBy?: string;
}

export interface ReviewInput {
  resolution: IncidentResolution;
  note?: string;
  dismiss?: boolean;
}

@Injectable()
export class IncidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chain: IntegrityChainService,
  ) {}

  private severityFor(category: string, riskScore?: number): IncidentSeverity {
    if (SEVERITY_BY_CATEGORY[category]) return SEVERITY_BY_CATEGORY[category];
    if (riskScore != null && riskScore >= 70) return 'high';
    if (riskScore != null && riskScore >= 30) return 'medium';
    return 'low';
  }

  private slaDue(severity: IncidentSeverity): Date {
    return new Date(Date.now() + SLA_HOURS[severity] * 3600 * 1000);
  }

  async open(tenantId: string, input: OpenIncidentInput) {
    const severity = input.severity ?? this.severityFor(input.category, input.riskScore);
    const incident = await this.prisma.proctoringIncident.create({
      data: {
        tenantId,
        sessionId: input.sessionId,
        userId: input.userId,
        category: input.category,
        severity,
        riskScore: input.riskScore,
        description: input.description,
        openedBy: input.openedBy ?? 'system',
        slaDueAt: this.slaDue(severity),
      },
    });
    await this.chain
      .append(tenantId, input.sessionId, 'proctor_action', {
        action: 'incident_opened',
        incidentId: incident.id,
        category: incident.category,
        severity,
        openedBy: incident.openedBy,
      })
      .catch(() => undefined);
    return incident;
  }

  // Auto-escalation from the risk engine. Deduped: one open incident per
  // (session, category) — repeat critical events don't spawn duplicates.
  async autoOpenOnCritical(tenantId: string, userId: string, sessionId: string, category: string, riskScore: number) {
    const existing = await this.prisma.proctoringIncident.findFirst({
      where: { tenantId, sessionId, category, status: { in: ['open', 'in_review'] } },
    });
    if (existing) return existing;
    return this.open(tenantId, {
      sessionId,
      userId,
      category,
      riskScore,
      openedBy: 'system',
      description: `Auto-opened: ${category} pushed session risk to ${riskScore}`,
    });
  }

  async list(tenantId: string, filters: { status?: string; severity?: string; sessionId?: string }) {
    return this.prisma.proctoringIncident.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status as IncidentStatus } : {}),
        ...(filters.severity ? { severity: filters.severity as IncidentSeverity } : {}),
        ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(tenantId: string, id: string) {
    const incident = await this.prisma.proctoringIncident.findFirst({ where: { id, tenantId } });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async assign(tenantId: string, id: string, reviewerId: string, assignee: string) {
    const incident = await this.get(tenantId, id);
    const updated = await this.prisma.proctoringIncident.update({
      where: { id },
      data: { assignedTo: assignee, status: 'in_review' },
    });
    await this.chain
      .append(tenantId, incident.sessionId, 'proctor_action', {
        action: 'incident_assigned',
        incidentId: id,
        assignedTo: assignee,
        by: reviewerId,
      })
      .catch(() => undefined);
    return updated;
  }

  async review(tenantId: string, id: string, reviewerId: string, input: ReviewInput) {
    const incident = await this.get(tenantId, id);
    const updated = await this.prisma.proctoringIncident.update({
      where: { id },
      data: {
        status: input.dismiss ? 'dismissed' : 'resolved',
        resolution: input.resolution,
        resolutionNote: input.note,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
    await this.chain
      .append(tenantId, incident.sessionId, 'proctor_action', {
        action: 'incident_reviewed',
        incidentId: id,
        resolution: input.resolution,
        dismissed: !!input.dismiss,
        by: reviewerId,
      })
      .catch(() => undefined);
    return updated;
  }

  async requestAppeal(tenantId: string, id: string, requesterId: string, reason: string) {
    const incident = await this.get(tenantId, id);
    const updated = await this.prisma.proctoringIncident.update({
      where: { id },
      data: { appealStatus: 'requested', appealReason: reason },
    });
    await this.chain
      .append(tenantId, incident.sessionId, 'proctor_action', {
        action: 'appeal_requested',
        incidentId: id,
        by: requesterId,
      })
      .catch(() => undefined);
    return updated;
  }

  async resolveAppeal(
    tenantId: string,
    id: string,
    resolverId: string,
    outcome: 'upheld' | 'overturned',
    note?: string,
  ) {
    const incident = await this.get(tenantId, id);
    const updated = await this.prisma.proctoringIncident.update({
      where: { id },
      data: {
        appealStatus: outcome,
        appealResolvedById: resolverId,
        appealResolvedAt: new Date(),
        appealNote: note,
      },
    });
    await this.chain
      .append(tenantId, incident.sessionId, 'proctor_action', {
        action: 'appeal_resolved',
        incidentId: id,
        outcome,
        by: resolverId,
      })
      .catch(() => undefined);
    return updated;
  }

  // Appeal evidence package: the incident + all supporting evidence for its
  // session, plus a live integrity-chain verification so a reviewer can confirm
  // nothing was altered.
  async evidenceExport(tenantId: string, id: string) {
    const incident = await this.get(tenantId, id);
    const [events, evidence, identity, scans, chainVerify, chain] = await Promise.all([
      this.prisma.proctoringEventLog.findMany({
        where: { sessionId: incident.sessionId },
        orderBy: { occurredAt: 'asc' },
      }),
      this.prisma.evidenceArtifact.findMany({
        where: { tenantId, sessionId: incident.sessionId },
        orderBy: { capturedAt: 'asc' },
      }),
      this.prisma.identityVerification.findMany({
        where: { tenantId, sessionId: incident.sessionId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.environmentScan.findMany({
        where: { tenantId, sessionId: incident.sessionId },
        orderBy: { createdAt: 'asc' },
      }),
      this.chain.verify(tenantId, incident.sessionId),
      this.chain.getChain(tenantId, incident.sessionId),
    ]);
    return {
      incident,
      integrity: chainVerify,
      counts: {
        events: events.length,
        evidence: evidence.length,
        identityChecks: identity.length,
        environmentScans: scans.length,
        chainEntries: chain.length,
      },
      events,
      evidence,
      identity,
      environmentScans: scans,
      chain,
    };
  }
}
