import { ForbiddenException } from '@nestjs/common';
import { InterviewService } from './interview.service';

describe('InterviewService.startInterview — biometric consent gate', () => {
  let videoRoom: any;
  let proctoring: any;
  let feedback: any;
  let scheduling: any;
  let biometricConsent: any;
  let service: InterviewService;

  beforeEach(() => {
    videoRoom = {
      createVideoRoom: jest.fn().mockResolvedValue({ roomId: 'room-1', agoraToken: 'tok' }),
      startRecording: jest.fn().mockResolvedValue(undefined),
    };
    proctoring = { monitorSession: jest.fn().mockResolvedValue({ monitoringStarted: true }) };
    feedback = {};
    scheduling = {};
    biometricConsent = { hasActiveConsent: jest.fn() };
    const request = { headers: { 'x-tenant-id': 'tenant-1' } };
    service = new InterviewService(
      videoRoom,
      proctoring,
      feedback,
      scheduling,
      biometricConsent,
      request,
    );
  });

  it('refuses to start a proctored interview without active biometric consent', async () => {
    biometricConsent.hasActiveConsent.mockResolvedValue(false);

    await expect(
      service.startInterview('interview-1', 'cand-1', 'Jane Candidate'),
    ).rejects.toThrow(ForbiddenException);

    expect(biometricConsent.hasActiveConsent).toHaveBeenCalledWith('cand-1', 'facial_detection');
    expect(videoRoom.createVideoRoom).not.toHaveBeenCalled();
    expect(proctoring.monitorSession).not.toHaveBeenCalled();
  });

  it('starts the interview and proctoring once consent is active', async () => {
    biometricConsent.hasActiveConsent.mockResolvedValue(true);

    const result = await service.startInterview('interview-1', 'cand-1', 'Jane Candidate');

    expect(proctoring.monitorSession).toHaveBeenCalledWith('interview-1');
    expect(videoRoom.startRecording).toHaveBeenCalledWith('room-1');
    expect(result).toEqual({
      roomId: 'room-1',
      agoraToken: 'tok',
      proctoringEnabled: true,
      recordingStarted: true,
    });
  });
});
