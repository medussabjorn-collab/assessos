import { Injectable } from '@nestjs/common';
import { EnvironmentScanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProctoringService, ProctoringEventType } from './proctoring.service';
import { PolicyService, EffectivePolicy } from './policy.service';

export interface SubmitScanInput {
  sessionId?: string;
  configId?: string;
  scanType?: string; // pre_session | periodic
  personsDetected?: number;
  monitorsDetected?: number;
  phoneDetected?: boolean;
  notesDetected?: boolean;
  whiteboardDetected?: boolean;
  lightingOk?: boolean;
  faceVisible?: boolean;
  audioBaselineDb?: number;
  ipCountry?: string;
  declaredCountry?: string;
  vpnDetected?: boolean;
  proxyDetected?: boolean;
  torDetected?: boolean;
  lockdownActive?: boolean;
  remoteAccessDetected?: boolean;
  vmDetected?: boolean;
  screenShareDetected?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * "Where are they taking it" pillar. Client CV/network/device probes post
 * their findings here; the backend evaluates them against the ProctoringPolicy,
 * computes clear/flagged/blocked + human-readable findings, and raises
 * proctoring events so environment anomalies feed the session risk score.
 */
@Injectable()
export class EnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proctoring: ProctoringService,
    private readonly policy: PolicyService,
  ) {}

  async submitScan(tenantId: string, userId: string, dto: SubmitScanInput) {
    const policy = await this.policy.getEffective(tenantId, dto.configId ?? null);
    const { status, findings, events } = this.evaluate(dto, policy);

    const scan = await this.prisma.environmentScan.create({
      data: {
        tenantId,
        userId,
        sessionId: dto.sessionId,
        scanType: dto.scanType ?? 'pre_session',
        personsDetected: dto.personsDetected ?? 1,
        monitorsDetected: dto.monitorsDetected ?? 1,
        phoneDetected: dto.phoneDetected ?? false,
        notesDetected: dto.notesDetected ?? false,
        whiteboardDetected: dto.whiteboardDetected ?? false,
        lightingOk: dto.lightingOk ?? true,
        faceVisible: dto.faceVisible ?? true,
        audioBaselineDb: dto.audioBaselineDb,
        ipCountry: dto.ipCountry,
        declaredCountry: dto.declaredCountry,
        vpnDetected: dto.vpnDetected ?? false,
        proxyDetected: dto.proxyDetected ?? false,
        torDetected: dto.torDetected ?? false,
        lockdownActive: dto.lockdownActive ?? false,
        remoteAccessDetected: dto.remoteAccessDetected ?? false,
        vmDetected: dto.vmDetected ?? false,
        screenShareDetected: dto.screenShareDetected ?? false,
        status,
        findings,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Feed anomalies into the session risk score (best-effort; needs a session).
    if (dto.sessionId) {
      for (const eventType of events) {
        await this.proctoring
          .logEvent(tenantId, userId, { sessionId: dto.sessionId, eventType, metadata: { scanId: scan.id } })
          .catch(() => undefined);
      }
    }

    return scan;
  }

  // Pure evaluation: detections + policy -> status, findings, proctoring events.
  evaluate(dto: SubmitScanInput, policy: EffectivePolicy) {
    const findings: string[] = [];
    const events: ProctoringEventType[] = [];
    let blocked = false;

    const persons = dto.personsDetected ?? 1;
    if (persons > 1 + policy.maxExtraPersons) {
      findings.push(`${persons - 1} extra person(s) detected`);
      events.push('extra_person');
      blocked = true;
    }

    const monitors = dto.monitorsDetected ?? 1;
    if (monitors > 1 && !policy.allowSecondScreen) {
      findings.push('Second screen detected');
      events.push('extra_monitor');
    }

    if (dto.phoneDetected) {
      findings.push('Phone detected');
      events.push('phone_detected');
      blocked = true;
    }
    if (dto.notesDetected) {
      findings.push('Notes detected');
      events.push('notes_detected');
    }
    if (dto.whiteboardDetected) {
      findings.push('Whiteboard detected');
      events.push('notes_detected');
    }
    if (dto.lightingOk === false) {
      findings.push('Poor lighting');
      events.push('low_lighting');
    }
    if (dto.faceVisible === false) {
      findings.push('Face not clearly visible');
      events.push('face_not_detected');
    }

    // Network / location
    const usingAnonymizer = dto.vpnDetected || dto.proxyDetected || dto.torDetected;
    if (usingAnonymizer) {
      findings.push('VPN/proxy/Tor detected');
      events.push('proxy_or_tor');
      if (policy.vpnAction === 'block') blocked = true;
    }
    if (dto.ipCountry && dto.declaredCountry && dto.ipCountry !== dto.declaredCountry) {
      findings.push(`IP country (${dto.ipCountry}) differs from declared (${dto.declaredCountry})`);
    }

    // Device posture
    if (dto.remoteAccessDetected) {
      findings.push('Remote-access tool detected');
      events.push('remote_desktop');
      if (policy.blockRemoteAccess) blocked = true;
    }
    if (dto.vmDetected) {
      findings.push('Virtual machine detected');
      events.push('vm_detected');
    }
    if (dto.screenShareDetected) {
      findings.push('Screen sharing detected');
      events.push('screen_share');
    }
    if (policy.requireLockdownBrowser && dto.lockdownActive === false) {
      findings.push('Lockdown browser required but not active');
      blocked = true;
    }

    let status: EnvironmentScanStatus = 'clear';
    if (blocked) status = 'blocked';
    else if (findings.length > 0) status = 'flagged';

    return { status, findings, events };
  }

  async getLatest(tenantId: string, userId: string, sessionId?: string) {
    return this.prisma.environmentScan.findFirst({
      where: { tenantId, userId, ...(sessionId ? { sessionId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Gate helper for the assessment-start flow.
  async isClear(tenantId: string, sessionId: string): Promise<boolean> {
    const latest = await this.prisma.environmentScan.findFirst({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'desc' },
    });
    return latest?.status === 'clear';
  }
}
