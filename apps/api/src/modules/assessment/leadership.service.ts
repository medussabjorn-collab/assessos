import { Injectable } from '@nestjs/common';

export interface Dimension {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface LeadershipCompetencies {
  dimensions: Dimension[];
  totalQuestions: number;
  questionsPerDimension: number;
}

@Injectable()
export class LeadershipService {
  private readonly dimensions: Dimension[] = [
    {
      id: 'vision',
      name: 'Vision & Strategy',
      description: 'Ability to articulate a clear vision and develop strategic plans',
      weight: 0.15,
    },
    {
      id: 'influence',
      name: 'Influence & Communication',
      description: 'Ability to persuade and communicate effectively',
      weight: 0.12,
    },
    {
      id: 'execution',
      name: 'Execution & Accountability',
      description: 'Ability to deliver results and hold others accountable',
      weight: 0.15,
    },
    {
      id: 'people',
      name: 'People Development',
      description: 'Ability to develop talent and build high-performing teams',
      weight: 0.14,
    },
    {
      id: 'innovation',
      name: 'Innovation & Adaptability',
      description: 'Ability to innovate and adapt to change',
      weight: 0.12,
    },
    {
      id: 'emotional_intelligence',
      name: 'Emotional Intelligence',
      description: 'Self-awareness and ability to manage emotions effectively',
      weight: 0.14,
    },
    {
      id: 'integrity',
      name: 'Integrity & Ethics',
      description: 'Commitment to ethical principles and transparency',
      weight: 0.1,
    },
    {
      id: 'collaboration',
      name: 'Collaboration & Partnership',
      description: 'Ability to work effectively across teams and organizations',
      weight: 0.12,
    },
  ];

  getCompetencies(): LeadershipCompetencies {
    return {
      dimensions: this.dimensions,
      totalQuestions: 80,
      questionsPerDimension: 10,
    };
  }

  getDimensions(): Dimension[] {
    return this.dimensions;
  }

  getDimensionById(id: string): Dimension | undefined {
    return this.dimensions.find((d) => d.id === id);
  }
}
