import { BadRequestException } from '@nestjs/common';
import { BigFiveModel } from './big-five.model';

describe('BigFiveModel (TIPI)', () => {
  let model: BigFiveModel;

  beforeEach(() => {
    model = new BigFiveModel();
  });

  describe('validateAnswers', () => {
    it('rejects wrong answer count', () => {
      expect(() => model.validateAnswers([{ itemId: 1, rating: 5 }])).toThrow(
        BadRequestException,
      );
    });

    it('rejects a rating outside 1-7', () => {
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: 4 }));
      answers[0].rating = 8;

      expect(() => model.validateAnswers(answers)).toThrow(BadRequestException);
    });

    it('rejects duplicate item ids', () => {
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: 4 }));
      answers[1].itemId = answers[0].itemId;

      expect(() => model.validateAnswers(answers)).toThrow(BadRequestException);
    });

    it('accepts a full valid answer set', () => {
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: 4 }));

      expect(() => model.validateAnswers(answers)).not.toThrow();
    });
  });

  describe('score', () => {
    it('scores all-7 (max agree) correctly applying reverse-scoring per item', () => {
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: 7 }));

      const result = model.score(answers);

      // Extraversion: item1 (E+, not reversed) = 7; item6 (E-, reversed) = 8-7 = 1 → avg 4
      expect(result.scores.extraversion).toBe(4);
      // Agreeableness: item2 (A-, reversed) = 8-7=1; item7 (A+, not reversed) = 7 → avg 4
      expect(result.scores.agreeableness).toBe(4);
    });

    it('scores a consistent high-extraversion, low-neuroticism profile as expected', () => {
      const ratings: Record<number, number> = {
        1: 7, // extraverted (E+) → high E
        6: 1, // reserved (E-, reversed: 8-1=7) → high E
        4: 1, // anxious (N+) → low N
        9: 7, // calm (N-, reversed: 8-7=1) → low N
        3: 4,
        8: 4,
        2: 4,
        7: 4,
        5: 4,
        10: 4,
      };
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: ratings[i.id] }));

      const result = model.score(answers);

      expect(result.scores.extraversion).toBe(7);
      expect(result.scores.neuroticism).toBe(1);
    });

    it('returns all five OCEAN traits', () => {
      const answers = model.getItems().map((i) => ({ itemId: i.id, rating: 4 }));

      const result = model.score(answers);

      expect(Object.keys(result.scores).sort()).toEqual(
        ['agreeableness', 'conscientiousness', 'extraversion', 'neuroticism', 'openness'].sort(),
      );
    });
  });
});
