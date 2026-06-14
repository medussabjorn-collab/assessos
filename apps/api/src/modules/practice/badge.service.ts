import { Injectable } from '@nestjs/common';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: string;
  tier?: string;
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
  progress?: number;
}

@Injectable()
export class BadgeService {
  private badges: Badge[] = [
    // Learning Badges
    {
      id: 'first_question',
      name: 'Getting Started',
      description: 'Answer your first practice question',
      icon: '🎯',
      category: 'learning',
      criteria: 'Answer 1 question correctly',
    },

    {
      id: 'streak_7',
      name: '7-Day Streak',
      description: 'Practice for 7 consecutive days',
      icon: '🔥',
      category: 'learning',
      criteria: 'Practice 7 days in a row',
    },

    {
      id: 'streak_30',
      name: 'Month Master',
      description: 'Practice for 30 consecutive days',
      icon: '⚡',
      category: 'learning',
      criteria: 'Practice 30 days in a row',
      tier: 'gold',
    },

    // Mastery Badges
    {
      id: 'leadership_expert',
      name: 'Leadership Expert',
      description: 'Master the Leadership domain',
      icon: '👑',
      category: 'mastery',
      criteria: 'Answer 50 leadership questions correctly',
    },

    {
      id: 'technical_guru',
      name: 'Technical Guru',
      description: 'Master the Technical domain',
      icon: '🧠',
      category: 'mastery',
      criteria: 'Answer 50 technical questions correctly',
    },

    {
      id: 'all_domains',
      name: 'Polymath',
      description: 'Master all knowledge domains',
      icon: '🌟',
      category: 'mastery',
      criteria: 'Master all available domains',
      tier: 'platinum',
    },

    // Difficulty Badges
    {
      id: 'easy_grind',
      name: 'Easy Mode',
      description: 'Answer 25 easy questions correctly',
      icon: '✨',
      category: 'difficulty',
      criteria: 'Answer 25 easy questions correctly',
    },

    {
      id: 'medium_challenger',
      name: 'Challenger',
      description: 'Answer 25 medium questions correctly',
      icon: '⚔️',
      category: 'difficulty',
      criteria: 'Answer 25 medium questions correctly',
    },

    {
      id: 'hard_warrior',
      name: 'Hard Mode Warrior',
      description: 'Answer 25 hard questions correctly',
      icon: '🏆',
      category: 'difficulty',
      criteria: 'Answer 25 hard questions correctly',
      tier: 'gold',
    },

    // Speed Badges
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Answer 5 questions in under 30 seconds each',
      icon: '⚡',
      category: 'speed',
      criteria: 'Answer 5 questions quickly',
    },

    {
      id: 'perfect_score',
      name: 'Perfect Day',
      description: 'Get 100% on 10 questions in one day',
      icon: '💯',
      category: 'accuracy',
      criteria: 'Answer 10 questions perfectly in one day',
    },
  ];

  getBadges(): Badge[] {
    return this.badges;
  }

  getBadgeById(badgeId: string): Badge | null {
    return this.badges.find((b) => b.id === badgeId) || null;
  }

  getBadgesByCategory(category: string): Badge[] {
    return this.badges.filter((b) => b.category === category);
  }

  checkBadgeUnlocked(
    userStats: {
      totalQuestionsAnswered: number;
      correctAnswers: number;
      streakDays: number;
      questionsPerDomain: Record<string, number>;
      perfectDayCount: number;
    },
    badgeId: string,
  ): boolean {
    const badge = this.getBadgeById(badgeId);
    if (!badge) return false;

    switch (badgeId) {
      case 'first_question':
        return userStats.correctAnswers >= 1;
      case 'streak_7':
        return userStats.streakDays >= 7;
      case 'streak_30':
        return userStats.streakDays >= 30;
      case 'leadership_expert':
        return (userStats.questionsPerDomain['leadership'] || 0) >= 50;
      case 'technical_guru':
        return (userStats.questionsPerDomain['technical'] || 0) >= 50;
      case 'all_domains':
        return Object.values(userStats.questionsPerDomain).every((count) => count >= 50);
      case 'easy_grind':
        return userStats.correctAnswers >= 25;
      case 'medium_challenger':
        return userStats.correctAnswers >= 50;
      case 'hard_warrior':
        return userStats.correctAnswers >= 75;
      case 'perfect_score':
        return userStats.perfectDayCount >= 1;
      default:
        return false;
    }
  }

  getProgressToBadge(
    userStats: any,
    badgeId: string,
  ): { current: number; target: number; percentage: number } {
    // Returns progress toward badge unlock
    const badge = this.getBadgeById(badgeId);
    if (!badge) return { current: 0, target: 0, percentage: 0 };

    let current = 0;
    let target = 0;

    switch (badgeId) {
      case 'leadership_expert':
        current = userStats.questionsPerDomain['leadership'] || 0;
        target = 50;
        break;
      case 'streak_7':
        current = userStats.streakDays || 0;
        target = 7;
        break;
      // ... more cases
      default:
        return { current: 0, target: 0, percentage: 0 };
    }

    return {
      current,
      target,
      percentage: Math.min(100, Math.round((current / target) * 100)),
    };
  }
}
