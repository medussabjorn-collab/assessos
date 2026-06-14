import { Injectable, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export interface LearnerStats {
  userId: string;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  accuracyRate: number;
  currentStreak: number;
  longestStreak: number;
  questionsPerDomain: Record<string, number>;
  correctPerDomain: Record<string, number>;
  timeSpent: number; // minutes
  badges: string[];
  certificationsEarned: string[];
}

@Injectable({ scope: Scope.REQUEST })
export class PerformanceService {
  private userId: string;

  constructor(@Inject(REQUEST) private request: any) {
    this.userId = request.user?.uid || '';
  }

  calculateAccuracyRate(
    correctAnswers: number,
    totalAnswered: number,
  ): number {
    if (totalAnswered === 0) return 0;
    return Math.round((correctAnswers / totalAnswered) * 100);
  }

  getPerformanceByDomain(
    questionsAnswered: Array<{
      domain: string;
      correct: boolean;
    }>,
  ): Record<string, { accuracy: number; count: number }> {
    const domainStats: Record<string, { correct: number; total: number }> = {};

    for (const question of questionsAnswered) {
      if (!domainStats[question.domain]) {
        domainStats[question.domain] = { correct: 0, total: 0 };
      }
      domainStats[question.domain].total++;
      if (question.correct) {
        domainStats[question.domain].correct++;
      }
    }

    const result: Record<string, { accuracy: number; count: number }> = {};
    for (const [domain, stats] of Object.entries(domainStats)) {
      result[domain] = {
        accuracy: this.calculateAccuracyRate(stats.correct, stats.total),
        count: stats.total,
      };
    }

    return result;
  }

  getPerformanceTrend(
    questionsAnswered: Array<{
      timestamp: Date;
      correct: boolean;
    }>,
    days: number = 7,
  ): Array<{ date: string; accuracy: number; count: number }> {
    // Group by day and calculate daily accuracy
    const dailyStats: Record<string, { correct: number; total: number }> = {};

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const question of questionsAnswered) {
      if (question.timestamp < cutoffDate) continue;

      const dateKey = question.timestamp.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { correct: 0, total: 0 };
      }
      dailyStats[dateKey].total++;
      if (question.correct) {
        dailyStats[dateKey].correct++;
      }
    }

    // Convert to sorted array
    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        accuracy: this.calculateAccuracyRate(stats.correct, stats.total),
        count: stats.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  calculateStreak(questionsAnswered: Array<{ timestamp: Date; correct: boolean }>): {
    current: number;
    longest: number;
  } {
    if (questionsAnswered.length === 0) return { current: 0, longest: 0 };

    // Sort by date descending
    const sorted = [...questionsAnswered].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const question of sorted) {
      if (question.correct) {
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  getRecommendedQuestions(
    stats: LearnerStats,
    availableDomains: string[],
  ): { domain: string; priority: number }[] {
    const recommendations: { domain: string; priority: number }[] = [];

    // Recommend weakest domains
    for (const domain of availableDomains) {
      const accuracy = stats.questionsPerDomain[domain]
        ? (stats.correctPerDomain[domain] / stats.questionsPerDomain[domain]) *
          100
        : 0;

      // Higher priority (lower score) = recommend more
      const priority = 100 - accuracy;
      recommendations.push({ domain, priority });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  estimateTimeToMastery(
    currentStats: LearnerStats,
    targetDomain: string,
    questionsPerDay: number = 5,
  ): {
    questionsRemaining: number;
    daysEstimated: number;
  } {
    const masteryThreshold = 50; // 50 questions mastered
    const currentCount = currentStats.questionsPerDomain[targetDomain] || 0;
    const questionsRemaining = Math.max(0, masteryThreshold - currentCount);
    const daysEstimated = Math.ceil(questionsRemaining / questionsPerDay);

    return { questionsRemaining, daysEstimated };
  }
}
