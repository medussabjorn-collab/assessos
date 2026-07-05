import { Injectable } from '@nestjs/common';

export type DiscDimension = 'D' | 'I' | 'S' | 'C';

export interface DiscOption {
  text: string;
  dimension: DiscDimension;
}

export interface DiscGroup {
  id: number;
  options: DiscOption[];
}

/**
 * Short-form DISC item bank: 12 forced-choice groups of four adjectives,
 * one per dimension. For each group the respondent picks the word MOST like
 * them and the word LEAST like them.
 */
@Injectable()
export class DiscQuestionsService {
  private readonly groups: DiscGroup[] = [
    {
      id: 1,
      options: [
        { text: 'Direct', dimension: 'D' },
        { text: 'Enthusiastic', dimension: 'I' },
        { text: 'Patient', dimension: 'S' },
        { text: 'Precise', dimension: 'C' },
      ],
    },
    {
      id: 2,
      options: [
        { text: 'Competitive', dimension: 'D' },
        { text: 'Sociable', dimension: 'I' },
        { text: 'Steady', dimension: 'S' },
        { text: 'Analytical', dimension: 'C' },
      ],
    },
    {
      id: 3,
      options: [
        { text: 'Decisive', dimension: 'D' },
        { text: 'Persuasive', dimension: 'I' },
        { text: 'Supportive', dimension: 'S' },
        { text: 'Systematic', dimension: 'C' },
      ],
    },
    {
      id: 4,
      options: [
        { text: 'Bold', dimension: 'D' },
        { text: 'Optimistic', dimension: 'I' },
        { text: 'Calm', dimension: 'S' },
        { text: 'Careful', dimension: 'C' },
      ],
    },
    {
      id: 5,
      options: [
        { text: 'Results-driven', dimension: 'D' },
        { text: 'Talkative', dimension: 'I' },
        { text: 'Loyal', dimension: 'S' },
        { text: 'Detail-oriented', dimension: 'C' },
      ],
    },
    {
      id: 6,
      options: [
        { text: 'Assertive', dimension: 'D' },
        { text: 'Charming', dimension: 'I' },
        { text: 'Consistent', dimension: 'S' },
        { text: 'Logical', dimension: 'C' },
      ],
    },
    {
      id: 7,
      options: [
        { text: 'Independent', dimension: 'D' },
        { text: 'Spontaneous', dimension: 'I' },
        { text: 'Cooperative', dimension: 'S' },
        { text: 'Organized', dimension: 'C' },
      ],
    },
    {
      id: 8,
      options: [
        { text: 'Ambitious', dimension: 'D' },
        { text: 'Expressive', dimension: 'I' },
        { text: 'Reliable', dimension: 'S' },
        { text: 'Perfectionist', dimension: 'C' },
      ],
    },
    {
      id: 9,
      options: [
        { text: 'Forceful', dimension: 'D' },
        { text: 'Playful', dimension: 'I' },
        { text: 'Gentle', dimension: 'S' },
        { text: 'Accurate', dimension: 'C' },
      ],
    },
    {
      id: 10,
      options: [
        { text: 'Risk-taker', dimension: 'D' },
        { text: 'Inspiring', dimension: 'I' },
        { text: 'Even-tempered', dimension: 'S' },
        { text: 'Disciplined', dimension: 'C' },
      ],
    },
    {
      id: 11,
      options: [
        { text: 'Self-reliant', dimension: 'D' },
        { text: 'Outgoing', dimension: 'I' },
        { text: 'Accommodating', dimension: 'S' },
        { text: 'Cautious', dimension: 'C' },
      ],
    },
    {
      id: 12,
      options: [
        { text: 'Determined', dimension: 'D' },
        { text: 'Lively', dimension: 'I' },
        { text: 'Harmonious', dimension: 'S' },
        { text: 'Methodical', dimension: 'C' },
      ],
    },
  ];

  getGroups(): DiscGroup[] {
    return this.groups;
  }

  getGroup(id: number): DiscGroup | undefined {
    return this.groups.find((g) => g.id === id);
  }
}
