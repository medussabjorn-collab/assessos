import { BadRequestException } from '@nestjs/common';

/**
 * Contract every psychometric model implements — DISC, Big Five, MBTI, etc.
 * Item bank shape, answer format, and scoring math are entirely
 * model-specific (ipsative forced-choice vs. Likert-sum vs. dichotomous
 * classification don't share an algorithm); only this interface is shared.
 *
 * score() must be a pure function — no DB access, no side effects — so each
 * model is unit-testable in isolation and the registry/controller stay dumb.
 */
export interface PsychometricModel<TAnswer = unknown, TResult = unknown> {
  readonly key: string;
  readonly label: string;

  getItems(): unknown[];

  /** Throws BadRequestException on malformed/incomplete answers. */
  validateAnswers(answers: TAnswer[]): void;

  score(answers: TAnswer[]): TResult;
}

export class UnknownPsychometricModelException extends BadRequestException {
  constructor(modelKey: string) {
    super(`Unknown psychometric model: ${modelKey}`);
  }
}
