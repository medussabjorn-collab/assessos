import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { QuestionLibraryService } from './question-library.service';
import { SpacedRepetitionService, CardState } from './spaced-repetition.service';
import { BadgeService } from './badge.service';
import { PerformanceService } from './performance.service';

@Injectable({ scope: Scope.REQUEST })
export class PracticeService {
  private userId: string;

  constructor(
    private questionLibrary: QuestionLibraryService,
    private spacedRepetition: SpacedRepetitionService,
    private badgeService: BadgeService,
    private performanceService: PerformanceService,
    @Inject(REQUEST) private request: any,
  ) {
    this.userId = request.user?.uid || '';
  }

  async getDashboard() {
    // Return personalized learning dashboard
    return {
      stats: {
        totalQuestionsAnswered: 145,
        correctAnswers: 98,
        accuracyRate: 67,
        currentStreak: 5,
        longestStreak: 12,
        timeSpentHours: 12,
      },
      dueToday: 8,
      suggestedDomain: 'leadership',
      recentBadges: ['first_question', 'streak_7'],
      nextMilestone: { name: 'Month Master', progress: 5, target: 30 },
    };
  }

  async getQuestionForLearning(domain?: string) {
    // Get next question based on spaced repetition algorithm
    const question = this.questionLibrary.getRandomQuestion(domain);

    if (!question) {
      throw new BadRequestException('No questions available');
    }

    return {
      id: question.id,
      domain: question.domain,
      topic: question.topic,
      difficulty: question.difficulty,
      question: question.question,
      options: question.options.map((o) => ({
        id: o.id,
        text: o.text,
      })),
      estimatedTime: question.estimatedTimeSec,
    };
  }

  async submitAnswer(
    questionId: string,
    selectedOptionId: string,
    timeTakenSec: number,
  ) {
    // Check answer and calculate score
    const question = this.questionLibrary.getQuestionById(questionId);

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    const selectedOption = question.options.find(
      (o) => o.id === selectedOptionId,
    );
    const isCorrect = selectedOption?.isCorrect || false;

    // Determine quality of response (0-5) for SM-2
    let quality = 0;
    if (!isCorrect) {
      quality = 1; // Incorrect
    } else if (timeTakenSec > question.estimatedTimeSec * 2) {
      quality = 3; // Correct but slow
    } else if (timeTakenSec > question.estimatedTimeSec) {
      quality = 4; // Correct but hesitant
    } else {
      quality = 5; // Correct and quick
    }

    return {
      isCorrect,
      quality,
      explanation: question.explanation,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async getDomainProgress(domain: string) {
    // Get mastery progress for a domain
    return {
      domain,
      questionsAnswered: 38,
      correctAnswers: 28,
      accuracyRate: 74,
      masteryLevel: 'Intermediate',
      progressToMastery: 76, // percentage
      topicsCompleted: 8,
      topicsInProgress: 3,
      topicsNotStarted: 2,
    };
  }

  async getCertificationRequirements(certification: string) {
    // Get what's needed to earn a certification
    return {
      name: 'Leadership Fundamentals',
      description: 'Comprehensive understanding of leadership principles',
      requirements: [
        {
          requirement: 'Answer 50 leadership questions correctly',
          current: 28,
          target: 50,
        },
        {
          requirement: 'Maintain 70% accuracy across all questions',
          current: 74,
          target: 70,
        },
        {
          requirement: 'Master at least 3 leadership topics',
          current: 2,
          target: 3,
        },
      ],
      estimatedDaysToCompletion: 14,
      readyForCertification: false,
    };
  }

  async earnCertification(certification: string) {
    // Award certification upon completion
    return {
      certificationId: `cert_${certification}_${Date.now()}`,
      name: 'Leadership Fundamentals Certified',
      earnedDate: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      shareableUrl: `https://assessos.app/verify/${certification}`,
    };
  }

  async getStudyPlan() {
    // Generate personalized study plan
    return {
      plan: [
        {
          day: 1,
          domain: 'leadership',
          questionsToAnswer: 5,
          estimatedMinutes: 15,
          focusArea: 'Decision Making',
        },
        {
          day: 2,
          domain: 'technical',
          questionsToAnswer: 5,
          estimatedMinutes: 20,
          focusArea: 'System Design',
        },
        {
          day: 3,
          domain: 'product',
          questionsToAnswer: 3,
          estimatedMinutes: 12,
          focusArea: 'Prioritization',
        },
      ],
      weeklyGoal: 20,
      questionsAnsweredThisWeek: 8,
    };
  }

  async getLeaderboard(domain?: string, timeFrame: string = 'week') {
    // Get top learners for competition/motivation
    return {
      timeFrame,
      domain: domain || 'overall',
      leaders: [
        {
          rank: 1,
          name: 'Alex Chen',
          questionsAnswered: 127,
          accuracy: 89,
          streak: 23,
          badge: '👑',
        },
        {
          rank: 2,
          name: 'Jamie Smith',
          questionsAnswered: 115,
          accuracy: 82,
          streak: 18,
          badge: '🥈',
        },
        {
          rank: 3,
          name: 'Morgan Lee',
          questionsAnswered: 103,
          accuracy: 76,
          streak: 12,
          badge: '🥉',
        },
      ],
      userRank: 8,
    };
  }
}
