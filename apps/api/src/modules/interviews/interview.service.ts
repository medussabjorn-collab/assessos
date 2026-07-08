import { ForbiddenException, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { VideoRoomService } from './video-room.service';
import { ProctoringService } from './proctoring.service';
import { InterviewFeedbackService } from './interview-feedback.service';
import { SchedulingService } from './scheduling.service';
import { BiometricConsentService } from '../compliance/biometric-consent.service';

const PROCTORING_BIOMETRIC_SCOPE = 'facial_detection';

@Injectable({ scope: Scope.REQUEST })
export class InterviewService {
  private tenantId: string;

  constructor(
    private videoRoom: VideoRoomService,
    private proctoring: ProctoringService,
    private feedback: InterviewFeedbackService,
    private scheduling: SchedulingService,
    private biometricConsent: BiometricConsentService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async startInterview(
    interviewId: string,
    candidateId: string,
    candidateName: string,
  ) {
    // BIPA / Illinois AI Video Interview Act gate — ProctoringService does
    // facial detection (see proctoring.service.ts), so no monitoring starts
    // without prior, scoped, non-expired consent from this candidate.
    const consented = await this.biometricConsent.hasActiveConsent(
      candidateId,
      PROCTORING_BIOMETRIC_SCOPE,
    );
    if (!consented) {
      throw new ForbiddenException(
        'Cannot start proctored interview: candidate has not given active ' +
          'biometric consent for facial detection. Collect consent via ' +
          'POST /api/compliance/candidates/:candidateId/biometric-consent first.',
      );
    }

    const videoRoom = await this.videoRoom.createVideoRoom(
      interviewId,
      candidateName,
      'Hiring Manager',
    );

    await this.proctoring.monitorSession(interviewId);
    await this.videoRoom.startRecording(videoRoom.roomId);

    return {
      roomId: videoRoom.roomId,
      agoraToken: videoRoom.agoraToken,
      proctoringEnabled: true,
      recordingStarted: true,
    };
  }

  async endInterview(interviewId: string) {
    // Stop recording and proctoring
    const proctoringReport = await this.proctoring.generateProctoringReport(
      interviewId,
      [],
    );

    return {
      recordingStopped: true,
      integrityScore: proctoringReport.integrityScore,
      cheatingRisk: proctoringReport.cheatingRisk,
    };
  }

  async submitInterviewFeedback(interviewId: string, feedbackData: any) {
    const result = await this.feedback.submitFeedback(feedbackData);
    return result;
  }

  async getInterviewDashboard() {
    return {
      upcomingInterviews: 3,
      completedInterviews: 12,
      averageRating: 4.2,
      proctoringAlerts: 1,
    };
  }

  async scheduleNextRound(candidateId: string, roundType: string) {
    const slots = await this.scheduling.getAvailableSlots('interviewer_1');
    return {
      availableSlots: slots,
      roundType,
      message: 'Select a time for the next round',
    };
  }
}
