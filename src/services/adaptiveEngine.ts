/**
 * Adaptive Assessment Engine — Item Response Theory (IRT) based
 * Uses 3-Parameter Logistic (3PL) model to dynamically select questions.
 */
import type { Question } from '../types';

export interface IRTParams {
  discrimination: number; // a — how well item discriminates (0.5–2.5)
  difficulty: number;     // b — difficulty on theta scale (-3 to +3)
  guessing: number;       // c — pseudo-guessing (0–0.35)
}

export interface CandidateAbility {
  theta: number;          // latent ability estimate (-3 to +3, default 0)
  seTheta: number;        // standard error of theta estimate
  responses: { questionId: string; correct: boolean; irt: IRTParams }[];
}

const DIFFICULTY_IRT: Record<string, IRTParams> = {
  easy:   { discrimination: 0.8,  difficulty: -1.5, guessing: 0.25 },
  medium: { discrimination: 1.2,  difficulty:  0.0, guessing: 0.20 },
  hard:   { discrimination: 1.8,  difficulty:  1.5, guessing: 0.15 },
};

/** 3PL probability of correct response */
export function icc(theta: number, params: IRTParams): number {
  const { discrimination: a, difficulty: b, guessing: c } = params;
  return c + (1 - c) / (1 + Math.exp(-1.702 * a * (theta - b)));
}

/** Fisher Information for item at theta */
function itemInfo(theta: number, params: IRTParams): number {
  const p = icc(theta, params);
  const { discrimination: a, guessing: c } = params;
  const q = 1 - p;
  if (q <= 0 || p <= c || p >= 1) return 0;
  return (1.702 ** 2 * a ** 2 * (p - c) ** 2 * q) / ((1 - c) ** 2 * p);
}

/** Maximum Likelihood Estimation of theta via Newton-Raphson */
function estimateTheta(ability: CandidateAbility): number {
  let theta = ability.theta;
  const responses = ability.responses;

  for (let iter = 0; iter < 20; iter++) {
    let L1 = 0; // first derivative of log-likelihood
    let L2 = 0; // second derivative

    for (const r of responses) {
      const p = icc(theta, r.irt);
      const q = 1 - p;
      if (p <= 0 || q <= 0) continue;
      const w = p * q;
      const diff = (r.correct ? 1 : 0) - p;
      L1 += diff / w * w; // simplifies to diff
      L2 -= w;
    }

    if (Math.abs(L2) < 1e-6) break;
    const delta = L1 / L2;
    theta -= delta;
    theta = Math.max(-4, Math.min(4, theta));
    if (Math.abs(delta) < 0.001) break;
  }

  return theta;
}

/** Select next question maximizing information at current theta */
export function selectNextQuestion(
  ability: CandidateAbility,
  remainingQuestions: Question[],
): Question {
  if (remainingQuestions.length === 0)
    throw new Error('No remaining questions');

  let bestQuestion = remainingQuestions[0];
  let bestInfo = -Infinity;

  for (const q of remainingQuestions) {
    const irt = DIFFICULTY_IRT[q.difficulty] ?? DIFFICULTY_IRT.medium;
    const info = itemInfo(ability.theta, irt);
    if (info > bestInfo) {
      bestInfo = info;
      bestQuestion = q;
    }
  }

  return bestQuestion;
}

/** Update ability estimate after a response */
export function updateAbility(
  ability: CandidateAbility,
  question: Question,
  correct: boolean,
): CandidateAbility {
  const irt = DIFFICULTY_IRT[question.difficulty] ?? DIFFICULTY_IRT.medium;
  const newResponses = [...ability.responses, { questionId: question.id, correct, irt }];
  const newAbility: CandidateAbility = { ...ability, responses: newResponses };

  if (newResponses.length < 3) {
    // Not enough data for MLE — use simple heuristic
    const thetaDelta = correct ? 0.3 : -0.3;
    const newTheta = Math.max(-4, Math.min(4, ability.theta + thetaDelta));
    return { ...newAbility, theta: newTheta };
  }

  const newTheta = estimateTheta(newAbility);

  // Standard error via Fisher Information
  const totalInfo = newResponses.reduce(
    (sum, r) => sum + itemInfo(newTheta, r.irt),
    0,
  );
  const seTheta = totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : 1.0;

  return { ...newAbility, theta: newTheta, seTheta };
}

/** Classify ability level */
export function classifyAbility(theta: number): string {
  if (theta >= 2.0)  return 'Expert';
  if (theta >= 1.0)  return 'Proficient';
  if (theta >= 0.0)  return 'Competent';
  if (theta >= -1.0) return 'Developing';
  return 'Novice';
}

/** Should we stop? (early termination when SE is low enough) */
export function shouldTerminate(ability: CandidateAbility, minQuestions = 20): boolean {
  return ability.responses.length >= minQuestions && ability.seTheta < 0.3;
}

/** Initialize a fresh ability estimate */
export function initAbility(): CandidateAbility {
  return { theta: 0, seTheta: 1.0, responses: [] };
}
