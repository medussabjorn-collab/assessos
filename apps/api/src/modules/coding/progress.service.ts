import { Injectable } from '@nestjs/common';

@Injectable()
export class ProgressService {
  getProgressStats() {
    return {
      totalSolved: 34,
      totalAttempts: 87,
      currentStreak: 8,
      longestStreak: 23,
      solvedByDifficulty: { easy: 15, medium: 12, hard: 7 },
      acceptanceRate: 39.1,
      averageAttempts: 2.56,
    };
  }

  getSolvedProblems() {
    return [
      { id: 'two-sum', title: 'Two Sum', difficulty: 'easy', solvedAt: new Date() },
      { id: 'reverse-string', title: 'Reverse String', difficulty: 'easy', solvedAt: new Date() },
    ];
  }
}
