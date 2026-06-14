import { Injectable } from '@nestjs/common';

export interface PracticeQuestion {
  id: string;
  domain: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation: string;
  category: string;
  tags: string[];
  estimatedTimeSec: number;
}

@Injectable()
export class QuestionLibraryService {
  private questions: PracticeQuestion[] = [
    // Leadership Domain
    {
      id: 'lead_001',
      domain: 'leadership',
      topic: 'decision_making',
      difficulty: 'easy',
      question:
        'What is the first step in making a strategic decision?',
      options: [
        {
          id: 'opt1',
          text: 'Gather information and understand the context',
          isCorrect: true,
        },
        { id: 'opt2', text: 'Jump to a solution immediately', isCorrect: false },
        {
          id: 'opt3',
          text: 'Consult only the highest authority',
          isCorrect: false,
        },
        {
          id: 'opt4',
          text: 'Avoid making the decision',
          isCorrect: false,
        },
      ],
      explanation:
        'Informed decision-making starts with understanding the full context, stakeholders, and available data before recommending a solution.',
      category: 'Strategic Thinking',
      tags: ['decision-making', 'strategy', 'leadership'],
      estimatedTimeSec: 45,
    },

    {
      id: 'lead_002',
      domain: 'leadership',
      topic: 'team_management',
      difficulty: 'medium',
      question:
        'How do you address conflict between team members?',
      options: [
        {
          id: 'opt1',
          text: 'Listen to both sides and find common ground',
          isCorrect: true,
        },
        {
          id: 'opt2',
          text: 'Take sides with the strongest personality',
          isCorrect: false,
        },
        { id: 'opt3', text: 'Ignore it and hope it resolves', isCorrect: false },
        {
          id: 'opt4',
          text: 'Fire whoever started the conflict',
          isCorrect: false,
        },
      ],
      explanation:
        'Effective conflict resolution involves understanding both perspectives, finding common interests, and facilitating collaboration toward a solution.',
      category: 'People Development',
      tags: ['conflict-resolution', 'communication', 'team-dynamics'],
      estimatedTimeSec: 60,
    },

    // Technical Domain (for software engineers)
    {
      id: 'tech_001',
      domain: 'technical',
      topic: 'system_design',
      difficulty: 'medium',
      question:
        'What is a key consideration when designing a scalable API?',
      options: [
        {
          id: 'opt1',
          text: 'Rate limiting and caching strategies',
          isCorrect: true,
        },
        { id: 'opt2', text: 'Making it as complex as possible', isCorrect: false },
        { id: 'opt3', text: 'Using the latest frameworks', isCorrect: false },
        {
          id: 'opt4',
          text: 'Avoiding documentation',
          isCorrect: false,
        },
      ],
      explanation:
        'Scalable APIs require rate limiting to prevent abuse, caching to reduce load, and proper load distribution across services.',
      category: 'System Architecture',
      tags: ['api-design', 'scalability', 'system-design'],
      estimatedTimeSec: 90,
    },

    // Product Domain
    {
      id: 'prod_001',
      domain: 'product',
      topic: 'roadmap_planning',
      difficulty: 'medium',
      question:
        'How do you prioritize features for your product roadmap?',
      options: [
        {
          id: 'opt1',
          text: 'Based on impact, effort, and user feedback',
          isCorrect: true,
        },
        {
          id: 'opt2',
          text: 'Whatever the CEO suggests first',
          isCorrect: false,
        },
        { id: 'opt3', text: 'Random selection', isCorrect: false },
        {
          id: 'opt4',
          text: 'Only what competitors are doing',
          isCorrect: false,
        },
      ],
      explanation:
        'Effective prioritization balances user impact, implementation effort, business goals, and strategic vision to maximize ROI.',
      category: 'Product Strategy',
      tags: ['prioritization', 'roadmapping', 'product-strategy'],
      estimatedTimeSec: 75,
    },
  ];

  getQuestionsByDomain(domain: string): PracticeQuestion[] {
    return this.questions.filter((q) => q.domain === domain);
  }

  getQuestionsByDifficulty(difficulty: string): PracticeQuestion[] {
    return this.questions.filter((q) => q.difficulty === difficulty);
  }

  getRandomQuestion(
    domain?: string,
    difficulty?: string,
  ): PracticeQuestion | null {
    let filtered = this.questions;

    if (domain) {
      filtered = filtered.filter((q) => q.domain === domain);
    }

    if (difficulty) {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    if (filtered.length === 0) {
      return null;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  getQuestionById(questionId: string): PracticeQuestion | null {
    return this.questions.find((q) => q.id === questionId) || null;
  }

  listDomains(): string[] {
    return [...new Set(this.questions.map((q) => q.domain))];
  }

  listTopics(domain: string): string[] {
    return [
      ...new Set(
        this.questions
          .filter((q) => q.domain === domain)
          .map((q) => q.topic),
      ),
    ];
  }

  getTotalQuestionCount(): number {
    return this.questions.length;
  }
}
