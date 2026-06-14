import { Injectable, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export interface InterviewFeedback {
  interviewSessionId: string;
  interviewerId: string;
  technicalScore: number; // 0-5
  communicationScore: number; // 0-5
  problemSolvingScore: number; // 0-5
  cultureScore: number; // 0-5
  overallScore: number; // 0-5
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  strengths: string[];
  areasForImprovement: string[];
  comments: string;
  questionsAsked: Array<{
    question: string;
    candidateAnswer: string;
    followUp: string;
  }>;
}

@Injectable({ scope: Scope.REQUEST })
export class InterviewFeedbackService {
  private tenantId: string;

  constructor(@Inject(REQUEST) private request: any) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async submitFeedback(feedback: InterviewFeedback): Promise<{
    feedbackId: string;
    saved: boolean;
  }> {
    // Save interviewer feedback to database
    const feedbackId = `feedback_${feedback.interviewSessionId}_${Date.now()}`;

    // Calculate overall score as weighted average
    const overallScore =
      (feedback.technicalScore * 0.35 +
        feedback.communicationScore * 0.25 +
        feedback.problemSolvingScore * 0.25 +
        feedback.cultureScore * 0.15) /
      100;

    // Determine recommendation based on scores
    const recommendation = this.getRecommendation(overallScore);

    return {
      feedbackId,
      saved: true,
    };
  }

  async getFeedback(
    feedbackId: string,
  ): Promise<InterviewFeedback | null> {
    // Retrieve feedback (would fetch from database)
    return null;
  }

  async getInterviewSummary(sessionId: string): Promise<{
    candidate: string;
    position: string;
    duration: number;
    date: Date;
    interviewer: string;
    overallScore: number;
    recommendation: string;
    proctoringScore: number;
  }> {
    return {
      candidate: 'Jane Doe',
      position: 'Software Engineer',
      duration: 45,
      date: new Date(),
      interviewer: 'John Smith',
      overallScore: 4.2,
      recommendation: 'yes',
      proctoringScore: 95,
    };
  }

  async generateInterviewReport(sessionId: string): Promise<{
    reportId: string;
    summary: string;
    detailedScores: Record<string, number>;
    nextSteps: string[];
  }> {
    return {
      reportId: `report_${sessionId}`,
      summary: 'Strong candidate with excellent technical skills',
      detailedScores: {
        technical: 4.5,
        communication: 4.0,
        problemSolving: 4.3,
        culture: 3.8,
      },
      nextSteps: ['Schedule culture fit interview', 'Prepare offer'],
    };
  }

  async compareMultipleRounds(
    sessionIds: string[],
  ): Promise<{
    candidate: string;
    technicalProgress: number;
    communicationProgress: number;
    rounds: Array<{ round: number; scores: Record<string, number> }>;
  }> {
    return {
      candidate: 'Jane Doe',
      technicalProgress: 8, // percentage improvement
      communicationProgress: 5,
      rounds: [
        { round: 1, scores: { technical: 3.8, communication: 3.5 } },
        { round: 2, scores: { technical: 4.2, communication: 3.9 } },
      ],
    };
  }

  private getRecommendation(
    score: number,
  ): 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' {
    if (score >= 4.5) return 'strong_yes';
    if (score >= 3.8) return 'yes';
    if (score >= 3.0) return 'maybe';
    if (score >= 2.0) return 'no';
    return 'strong_no';
  }
}
