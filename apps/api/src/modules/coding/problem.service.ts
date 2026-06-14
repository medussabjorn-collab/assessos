import { Injectable } from '@nestjs/common';

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
  testCases: Array<{ input: string; expectedOutput: string }>;
  timeLimit: number; // seconds
  memoryLimit: number; // MB
  tags: string[];
  acceptanceRate: number;
  solverCount: number;
}

@Injectable()
export class ProblemService {
  private problems: CodingProblem[] = [
    {
      id: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      description: 'Given an array of integers, return indices of two numbers that add up to target.',
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'nums[0] + nums[1] == 9',
        },
      ],
      testCases: [
        { input: '[2,7,11,15],9', expectedOutput: '[0,1]' },
        { input: '[3,2,4],6', expectedOutput: '[1,2]' },
      ],
      timeLimit: 1,
      memoryLimit: 256,
      tags: ['array', 'hash-table'],
      acceptanceRate: 47.3,
      solverCount: 5200,
    },
    {
      id: 'reverse-string',
      title: 'Reverse String',
      difficulty: 'easy',
      description: 'Reverse a string in-place.',
      constraints: ['1 <= s.length <= 10^5'],
      examples: [
        { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: 'Reversed' },
      ],
      testCases: [
        { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' },
      ],
      timeLimit: 1,
      memoryLimit: 256,
      tags: ['string', 'two-pointers'],
      acceptanceRate: 79.2,
      solverCount: 3100,
    },
    {
      id: 'longest-substring',
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'medium',
      description: 'Find the length of longest substring without repeating chars.',
      constraints: ['0 <= s.length <= 5 * 10^4'],
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: '"abc"' },
      ],
      testCases: [
        { input: '"abcabcbb"', expectedOutput: '3' },
        { input: '"bbbbb"', expectedOutput: '1' },
      ],
      timeLimit: 2,
      memoryLimit: 512,
      tags: ['string', 'sliding-window', 'hash-table'],
      acceptanceRate: 33.4,
      solverCount: 2800,
    },
  ];

  getProblem(id: string): CodingProblem | null {
    return this.problems.find((p) => p.id === id) || null;
  }

  listProblems(difficulty?: string): CodingProblem[] {
    if (difficulty) {
      return this.problems.filter((p) => p.difficulty === difficulty);
    }
    return this.problems;
  }

  getProblemsByTag(tag: string): CodingProblem[] {
    return this.problems.filter((p) => p.tags.includes(tag));
  }

  getTotalProblems(): number {
    return this.problems.length;
  }
}
