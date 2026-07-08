import { BadRequestException, Injectable } from '@nestjs/common';
import { PsychometricModel } from '../psychometric-model.interface';

export type BigFiveTrait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export interface TipiItem {
  id: number;
  text: string;
  trait: BigFiveTrait;
  reverseScored: boolean;
}

export interface BigFiveAnswer {
  itemId: number;
  // 1-7 Likert: "I see myself as: ___ — Disagree strongly ... Agree strongly"
  rating: number;
}

export interface BigFiveResult {
  scores: Record<BigFiveTrait, number>;
  traitNames: Record<BigFiveTrait, string>;
}

const TRAITS: BigFiveTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

const TRAIT_NAMES: Record<BigFiveTrait, string> = {
  openness: 'Openness to Experience',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism (Emotional Stability, reverse)',
};

/**
 * Ten-Item Personality Inventory (TIPI) — Gosling, Rentfrow & Swann (2003),
 * "A very brief measure of the Big-Five personality domains," Journal of
 * Research in Personality 37, 504-528. Public-domain instrument, reproduced
 * verbatim (item pairing and reverse-scoring exactly as published) — not an
 * invented scale. Two items per trait, one of each pair reverse-scored.
 *
 * Known tradeoff, same as the original: a 10-item measure trades precision
 * for brevity relative to the full 44-100 item Big Five inventories. That's
 * the published instrument's documented limitation, not a bug here.
 */
const ITEMS: TipiItem[] = [
  { id: 1, text: 'Extraverted, enthusiastic.', trait: 'extraversion', reverseScored: false },
  { id: 2, text: 'Critical, quarrelsome.', trait: 'agreeableness', reverseScored: true },
  { id: 3, text: 'Dependable, self-disciplined.', trait: 'conscientiousness', reverseScored: false },
  { id: 4, text: 'Anxious, easily upset.', trait: 'neuroticism', reverseScored: false },
  { id: 5, text: 'Open to new experiences, complex.', trait: 'openness', reverseScored: false },
  { id: 6, text: 'Reserved, quiet.', trait: 'extraversion', reverseScored: true },
  { id: 7, text: 'Sympathetic, warm.', trait: 'agreeableness', reverseScored: false },
  { id: 8, text: 'Disorganized, careless.', trait: 'conscientiousness', reverseScored: true },
  { id: 9, text: 'Calm, emotionally stable.', trait: 'neuroticism', reverseScored: true },
  { id: 10, text: 'Conventional, uncreative.', trait: 'openness', reverseScored: true },
];

@Injectable()
export class BigFiveModel implements PsychometricModel<BigFiveAnswer, BigFiveResult> {
  readonly key = 'big_five';
  readonly label = 'Big Five (TIPI)';

  getItems(): TipiItem[] {
    return ITEMS;
  }

  validateAnswers(answers: BigFiveAnswer[]): void {
    if (answers.length !== ITEMS.length) {
      throw new BadRequestException(`Expected ${ITEMS.length} answers, got ${answers.length}`);
    }

    const seen = new Set<number>();
    for (const answer of answers) {
      const item = ITEMS.find((i) => i.id === answer.itemId);
      if (!item || seen.has(answer.itemId)) {
        throw new BadRequestException(`Invalid or duplicate item ${answer.itemId}`);
      }
      if (!Number.isInteger(answer.rating) || answer.rating < 1 || answer.rating > 7) {
        throw new BadRequestException(`Item ${answer.itemId}: rating must be an integer 1-7`);
      }
      seen.add(answer.itemId);
    }
  }

  score(answers: BigFiveAnswer[]): BigFiveResult {
    const byId = new Map(answers.map((a) => [a.itemId, a.rating]));

    const scoreFor = (trait: BigFiveTrait): number => {
      const traitItems = ITEMS.filter((i) => i.trait === trait);
      const values = traitItems.map((item) => {
        const raw = byId.get(item.id)!;
        return item.reverseScored ? 8 - raw : raw;
      });
      // Average of the two items, on the original 1-7 scale.
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    };

    const scores = Object.fromEntries(
      TRAITS.map((t) => [t, scoreFor(t)]),
    ) as Record<BigFiveTrait, number>;

    return { scores, traitNames: TRAIT_NAMES };
  }
}
