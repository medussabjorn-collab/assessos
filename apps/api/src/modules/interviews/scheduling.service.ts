import { Injectable } from '@nestjs/common';

@Injectable()
export class SchedulingService {
  async scheduleInterview(candidateId: string, slotId: string): Promise<{
    interviewId: string;
    scheduledFor: Date;
    roomId: string;
    joinUrl: string;
  }> {
    const interviewId = `interview_${candidateId}_${Date.now()}`;
    const scheduledFor = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

    return {
      interviewId,
      scheduledFor,
      roomId: `room_${interviewId}`,
      joinUrl: `https://assessos.app/interview/${interviewId}`,
    };
  }

  async getAvailableSlots(
    interviewerId: string,
    daysAhead: number = 7,
  ): Promise<
    Array<{ slotId: string; dateTime: Date; duration: number; booked: boolean }>
  > {
    return [
      {
        slotId: 'slot_1',
        dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        duration: 60,
        booked: false,
      },
      {
        slotId: 'slot_2',
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 60,
        booked: false,
      },
    ];
  }

  async getCandidateAvailability(candidateId: string): Promise<{
    preferredTimeZone: string;
    availableSlots: string[];
  }> {
    return {
      preferredTimeZone: 'America/New_York',
      availableSlots: ['9:00 AM', '2:00 PM', '4:00 PM'],
    };
  }

  async sendInterviewReminder(
    interviewId: string,
  ): Promise<{ sent: boolean }> {
    // Send email/SMS reminder 24 hours before
    return { sent: true };
  }

  async rescheduleInterview(
    interviewId: string,
    newSlotId: string,
  ): Promise<{ success: boolean; newScheduledTime: Date }> {
    return {
      success: true,
      newScheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
  }
}
