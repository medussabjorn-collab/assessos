import { BadRequestException, Injectable } from '@nestjs/common';
import { PsychometricModel } from '../psychometric-model.interface';

export type DiscDimension = 'D' | 'I' | 'S' | 'C';

export interface DiscOption {
  text: string;
  dimension: DiscDimension;
}

export interface DiscGroup {
  id: number;
  options: DiscOption[];
}

export interface DiscAnswer {
  groupId: number;
  most: DiscDimension;
  least: DiscDimension;
}

export interface DiscResult {
  scores: Record<DiscDimension, number>;
  primaryType: DiscDimension;
  secondaryType: DiscDimension | null;
  profileLabel: string;
  dimensionNames: Record<DiscDimension, string>;
}

const DIMENSIONS: DiscDimension[] = ['D', 'I', 'S', 'C'];

const DIMENSION_NAMES: Record<DiscDimension, string> = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

// Primary-secondary blends. Pure types apply when no secondary qualifies.
const PROFILE_LABELS: Record<string, string> = {
  D: 'Driver',
  I: 'Motivator',
  S: 'Stabilizer',
  C: 'Analyst',
  DI: 'Initiator',
  DC: 'Architect',
  DS: 'Achiever',
  ID: 'Persuader',
  IS: 'Encourager',
  IC: 'Assessor',
  SD: 'Specialist',
  SI: 'Counselor',
  SC: 'Coordinator',
  CD: 'Perfectionist',
  CI: 'Appraiser',
  CS: 'Practitioner',
};

/**
 * Short-form DISC item bank: 12 forced-choice groups of four adjectives,
 * one per dimension. For each group the respondent picks the word MOST like
 * them and the word LEAST like them (ipsative scoring).
 */
const GROUPS: DiscGroup[] = [
  { id: 1, options: [
    { text: 'Direct', dimension: 'D' }, { text: 'Enthusiastic', dimension: 'I' },
    { text: 'Patient', dimension: 'S' }, { text: 'Precise', dimension: 'C' },
  ] },
  { id: 2, options: [
    { text: 'Competitive', dimension: 'D' }, { text: 'Sociable', dimension: 'I' },
    { text: 'Steady', dimension: 'S' }, { text: 'Analytical', dimension: 'C' },
  ] },
  { id: 3, options: [
    { text: 'Decisive', dimension: 'D' }, { text: 'Persuasive', dimension: 'I' },
    { text: 'Supportive', dimension: 'S' }, { text: 'Systematic', dimension: 'C' },
  ] },
  { id: 4, options: [
    { text: 'Bold', dimension: 'D' }, { text: 'Optimistic', dimension: 'I' },
    { text: 'Calm', dimension: 'S' }, { text: 'Careful', dimension: 'C' },
  ] },
  { id: 5, options: [
    { text: 'Results-driven', dimension: 'D' }, { text: 'Talkative', dimension: 'I' },
    { text: 'Loyal', dimension: 'S' }, { text: 'Detail-oriented', dimension: 'C' },
  ] },
  { id: 6, options: [
    { text: 'Assertive', dimension: 'D' }, { text: 'Charming', dimension: 'I' },
    { text: 'Consistent', dimension: 'S' }, { text: 'Logical', dimension: 'C' },
  ] },
  { id: 7, options: [
    { text: 'Independent', dimension: 'D' }, { text: 'Spontaneous', dimension: 'I' },
    { text: 'Cooperative', dimension: 'S' }, { text: 'Organized', dimension: 'C' },
  ] },
  { id: 8, options: [
    { text: 'Ambitious', dimension: 'D' }, { text: 'Expressive', dimension: 'I' },
    { text: 'Reliable', dimension: 'S' }, { text: 'Perfectionist', dimension: 'C' },
  ] },
  { id: 9, options: [
    { text: 'Forceful', dimension: 'D' }, { text: 'Playful', dimension: 'I' },
    { text: 'Gentle', dimension: 'S' }, { text: 'Accurate', dimension: 'C' },
  ] },
  { id: 10, options: [
    { text: 'Risk-taker', dimension: 'D' }, { text: 'Inspiring', dimension: 'I' },
    { text: 'Even-tempered', dimension: 'S' }, { text: 'Disciplined', dimension: 'C' },
  ] },
  { id: 11, options: [
    { text: 'Self-reliant', dimension: 'D' }, { text: 'Outgoing', dimension: 'I' },
    { text: 'Accommodating', dimension: 'S' }, { text: 'Cautious', dimension: 'C' },
  ] },
  { id: 12, options: [
    { text: 'Determined', dimension: 'D' }, { text: 'Lively', dimension: 'I' },
    { text: 'Harmonious', dimension: 'S' }, { text: 'Methodical', dimension: 'C' },
  ] },
];

@Injectable()
export class DiscModel implements PsychometricModel<DiscAnswer, DiscResult> {
  readonly key = 'disc';
  readonly label = 'DISC Assessment';

  getItems(): DiscGroup[] {
    return GROUPS;
  }

  validateAnswers(answers: DiscAnswer[]): void {
    if (answers.length !== GROUPS.length) {
      throw new BadRequestException(
        `Expected ${GROUPS.length} answers, got ${answers.length}`,
      );
    }

    const seen = new Set<number>();
    for (const answer of answers) {
      const group = GROUPS.find((g) => g.id === answer.groupId);
      if (!group || seen.has(answer.groupId)) {
        throw new BadRequestException(`Invalid or duplicate group ${answer.groupId}`);
      }
      if (
        !DIMENSIONS.includes(answer.most) ||
        !DIMENSIONS.includes(answer.least) ||
        answer.most === answer.least
      ) {
        throw new BadRequestException(
          `Group ${answer.groupId}: most and least must be distinct dimensions`,
        );
      }
      seen.add(answer.groupId);
    }
  }

  score(answers: DiscAnswer[]): DiscResult {
    const raw: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    for (const answer of answers) {
      raw[answer.most] += 1;
      raw[answer.least] -= 1;
    }

    // Raw range per dimension: -N..+N where N = group count. Normalize 0-100.
    const n = GROUPS.length;
    const scores = Object.fromEntries(
      DIMENSIONS.map((d) => [d, Math.round(((raw[d] + n) / (2 * n)) * 100)]),
    ) as Record<DiscDimension, number>;

    const sorted = [...DIMENSIONS].sort((a, b) => scores[b] - scores[a]);
    const primaryType = sorted[0];
    // Secondary qualifies when clearly elevated (above the neutral midpoint)
    // and within 15 points of the primary.
    const secondaryType =
      scores[sorted[1]] > 50 && scores[primaryType] - scores[sorted[1]] <= 15
        ? sorted[1]
        : null;

    const labelKey = secondaryType ? `${primaryType}${secondaryType}` : primaryType;
    const profileLabel = PROFILE_LABELS[labelKey] ?? PROFILE_LABELS[primaryType];

    return {
      scores,
      primaryType,
      secondaryType,
      profileLabel,
      dimensionNames: DIMENSION_NAMES,
    };
  }
}
