import { Injectable } from '@nestjs/common';

@Injectable()
export class LeaderboardService {
  getGlobalLeaderboard(timeFrame: 'week' | 'month' | 'all' = 'week') {
    return {
      timeFrame,
      leaders: [
        { rank: 1, name: 'AlgoMaster', solved: 87, score: 8700, badge: '👑' },
        { rank: 2, name: 'CodeNinja', solved: 82, score: 8200, badge: '🥈' },
        { rank: 3, name: 'ByteWizard', solved: 78, score: 7800, badge: '🥉' },
      ],
      userRank: 45,
      userScore: 3450,
    };
  }

  getDifficultyLeaderboard(difficulty: 'easy' | 'medium' | 'hard') {
    return {
      difficulty,
      leaders: [
        { rank: 1, solved: 45, fastestTime: 312 },
        { rank: 2, solved: 42, fastestTime: 387 },
      ],
    };
  }

  getStreakLeaderboard() {
    return {
      currentStreaks: [
        { rank: 1, name: 'ConsistentCoder', streak: 127 },
        { rank: 2, name: 'DailyGrinder', streak: 98 },
      ],
      userStreak: 8,
    };
  }
}
