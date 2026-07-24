import { api } from './apiClient';
import type { AssessmentModuleId, Question } from '../types';

export interface SessionStartResponse {
  data: {
    sessionId: string;
    moduleId: AssessmentModuleId;
    totalQuestions: number;
    timeLimitMin: number;
    expiresAt: string;
  };
}

export interface CurrentQuestionResponse {
  data: {
    question: Question;
    currentIndex: number;
    totalQuestions: number;
    timeRemainingSeconds: number;
  };
}

export interface SubmitAnswerResponse {
  data: {
    correct: boolean;
    nextIndex: number;
    isComplete: boolean;
  };
}

export interface SessionResult {
  id: string;
  moduleId: AssessmentModuleId;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds: number;
  irtTheta: number;
  irtTier: string;
  subTopicScores: Record<string, number>;
  aiInsights: string[];
  completedAt: string;
}

export interface ResultsListResponse {
  data: SessionResult[];
}

export interface ResultDetailResponse {
  data: SessionResult;
}

export const assessmentApi = {
  startSession: (moduleId: AssessmentModuleId) =>
    api.post<SessionStartResponse>(`/assessments/sessions/${moduleId}/start`, {}),

  getCurrentQuestion: (sessionId: string) =>
    api.get<CurrentQuestionResponse>(`/assessments/sessions/${sessionId}/question`),

  submitAnswer: (sessionId: string, questionId: string, selectedOption: number, flagged = false) =>
    api.post<SubmitAnswerResponse>(`/assessments/sessions/${sessionId}/answer`, {
      questionId,
      selectedOption,
      flagged,
    }),

  submitSession: (sessionId: string) =>
    api.post<ResultDetailResponse>(`/assessments/sessions/${sessionId}/submit`, {}),

  getResults: () =>
    api.get<ResultsListResponse>('/assessments/results'),

  getResult: (resultId: string) =>
    api.get<ResultDetailResponse>(`/assessments/results/${resultId}`),
};
