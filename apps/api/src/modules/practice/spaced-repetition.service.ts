import { Injectable } from '@nestjs/common';

export interface CardState {
  questionId: string;
  interval: number; // days until next review
  easeFactor: number; // 1.3-2.5, difficulty modifier
  repetitions: number; // number of times reviewed
  dueDate: Date;
  lastReviewDate?: Date;
  quality: number; // 0-5, quality of last response
}

/**
 * Implements SM-2 (SuperMemo 2) spaced repetition algorithm
 * Optimizes review timing based on forgetting curve research
 */
@Injectable()
export class SpacedRepetitionService {
  private DEFAULT_EASE_FACTOR = 2.5;
  private MIN_EASE_FACTOR = 1.3;

  calculateNextReview(
    currentCard: CardState,
    qualityOfResponse: number,
  ): CardState {
    // Quality: 0=blackout, 1=incorrect, 2=incorrect but recall, 3=correct slow, 4=correct hesitant, 5=correct easy

    if (qualityOfResponse < 3) {
      // Response was incorrect or poor - restart learning
      return {
        ...currentCard,
        interval: 1,
        repetitions: 0,
        easeFactor: Math.max(
          this.MIN_EASE_FACTOR,
          currentCard.easeFactor - 0.2,
        ),
        dueDate: this.addDays(new Date(), 1),
        quality: qualityOfResponse,
      };
    }

    // Correct response - apply SM-2 algorithm
    let interval: number;
    let repetitions = currentCard.repetitions + 1;

    if (repetitions === 1) {
      interval = 1; // First review tomorrow
    } else if (repetitions === 2) {
      interval = 3; // Second review in 3 days
    } else {
      interval = Math.round(currentCard.interval * currentCard.easeFactor);
    }

    const easeFactor = this.calculateEaseFactor(
      currentCard.easeFactor,
      qualityOfResponse,
    );

    return {
      ...currentCard,
      interval,
      repetitions,
      easeFactor,
      dueDate: this.addDays(new Date(), interval),
      lastReviewDate: new Date(),
      quality: qualityOfResponse,
    };
  }

  private calculateEaseFactor(
    currentEase: number,
    quality: number,
  ): number {
    const newEase =
      currentEase + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    return Math.max(this.MIN_EASE_FACTOR, newEase);
  }

  getDueCards(cards: CardState[]): CardState[] {
    const now = new Date();
    return cards.filter((card) => card.dueDate <= now);
  }

  getCardsDueToday(cards: CardState[]): CardState[] {
    const today = new Date();
    const tomorrow = this.addDays(today, 1);

    return cards.filter(
      (card) => card.dueDate >= today && card.dueDate < tomorrow,
    );
  }

  getStudyStatistics(cards: CardState[]) {
    const now = new Date();

    return {
      totalCards: cards.length,
      reviewedToday: cards.filter((c) => {
        if (!c.lastReviewDate) return false;
        return this.isSameDay(c.lastReviewDate, now);
      }).length,
      dueToday: this.getCardsDueToday(cards).length,
      newCards: cards.filter((c) => c.repetitions === 0).length,
      learningCards: cards.filter(
        (c) => c.repetitions > 0 && c.repetitions < 3,
      ).length,
      masteredCards: cards.filter((c) => c.repetitions >= 3).length,
      nextReviewDate: this.getNextReviewDate(cards),
    };
  }

  getNextReviewDate(cards: CardState[]): Date | null {
    const upcoming = cards
      .filter((c) => c.dueDate > new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return upcoming.length > 0 ? upcoming[0].dueDate : null;
  }

  initializeCard(questionId: string): CardState {
    return {
      questionId,
      interval: 0,
      easeFactor: this.DEFAULT_EASE_FACTOR,
      repetitions: 0,
      dueDate: new Date(), // Due immediately
      quality: 0,
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
