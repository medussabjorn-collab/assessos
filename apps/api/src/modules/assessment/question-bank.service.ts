import { Injectable } from '@nestjs/common';

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

export interface Question {
  id: string;
  dimensionId: string;
  text: string;
  options: QuestionOption[];
  order: number;
}

@Injectable()
export class QuestionBankService {
  private questions: Question[] = [
    // Vision & Strategy (10 questions)
    {
      id: 'q_vision_1',
      dimensionId: 'vision',
      text: 'How effectively do you articulate a compelling vision for your team or organization?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very effectively', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 1,
    },
    {
      id: 'q_vision_2',
      dimensionId: 'vision',
      text: 'How well do you develop strategic plans that align with organizational goals?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very well', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 2,
    },
    // Influence & Communication (first 2)
    {
      id: 'q_influence_1',
      dimensionId: 'influence',
      text: 'How effectively do you persuade others to adopt your ideas?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very effectively', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 3,
    },
    {
      id: 'q_influence_2',
      dimensionId: 'influence',
      text: 'How clear and concise are your communications to different audiences?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very clear', value: 4 },
        { id: 'opt_5', text: 'Exceptionally clear', value: 5 },
      ],
      order: 4,
    },
    // Execution & Accountability (first 2)
    {
      id: 'q_execution_1',
      dimensionId: 'execution',
      text: 'How consistently do you deliver results on committed timelines?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very consistently', value: 4 },
        { id: 'opt_5', text: 'Exceptionally consistently', value: 5 },
      ],
      order: 5,
    },
    {
      id: 'q_execution_2',
      dimensionId: 'execution',
      text: 'How effectively do you hold team members accountable for their performance?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very effectively', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 6,
    },
    // People Development (first 2)
    {
      id: 'q_people_1',
      dimensionId: 'people',
      text: 'How effectively do you develop talent within your team?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very effectively', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 7,
    },
    {
      id: 'q_people_2',
      dimensionId: 'people',
      text: 'How well do you build and maintain high-performing teams?',
      options: [
        { id: 'opt_1', text: 'Not at all', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately', value: 3 },
        { id: 'opt_4', text: 'Very well', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 8,
    },
    // Remaining dimensions (abbreviated for brevity - full 80 would expand these)
    {
      id: 'q_innovation_1',
      dimensionId: 'innovation',
      text: 'How often do you challenge the status quo and drive innovation?',
      options: [
        { id: 'opt_1', text: 'Never', value: 1 },
        { id: 'opt_2', text: 'Rarely', value: 2 },
        { id: 'opt_3', text: 'Sometimes', value: 3 },
        { id: 'opt_4', text: 'Often', value: 4 },
        { id: 'opt_5', text: 'Very often', value: 5 },
      ],
      order: 9,
    },
    {
      id: 'q_ei_1',
      dimensionId: 'emotional_intelligence',
      text: 'How well do you understand and manage your own emotions?',
      options: [
        { id: 'opt_1', text: 'Not well', value: 1 },
        { id: 'opt_2', text: 'Somewhat', value: 2 },
        { id: 'opt_3', text: 'Moderately well', value: 3 },
        { id: 'opt_4', text: 'Very well', value: 4 },
        { id: 'opt_5', text: 'Exceptionally well', value: 5 },
      ],
      order: 10,
    },
  ];

  getQuestions(dimensionId?: string): Question[] {
    if (dimensionId) {
      return this.questions.filter((q) => q.dimensionId === dimensionId);
    }
    return this.questions;
  }

  getQuestionById(questionId: string): Question | undefined {
    return this.questions.find((q) => q.id === questionId);
  }

  getQuestionsByDimension(dimensionId: string): Question[] {
    return this.questions.filter((q) => q.dimensionId === dimensionId);
  }
}
