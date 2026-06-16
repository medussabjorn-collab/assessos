import { IrtAbility, IrtParams } from '../types';

/**
 * IRT 3-Parameter Logistic Model
 * P(θ) = c + (1-c) / (1 + e^(-1.702 * a * (θ - b)))
 */

const D = 1.702; // scaling constant

export function icc(theta: number, { a, b, c }: IrtParams): number {
  return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
}

export function itemInformation(theta: number, params: IrtParams): number {
  const p = icc(theta, params);
  const { a, c } = params;
  const q = 1 - p;
  return D * D * a * a * (((p - c) / (1 - c)) ** 2) * (q / p);
}

/**
 * MLE theta estimation via Newton-Raphson (20 iterations)
 */
export function estimateTheta(
  responses: { correct: boolean; params: IrtParams }[],
  initialTheta = 0
): number {
  let theta = initialTheta;

  for (let iter = 0; iter < 20; iter++) {
    let firstDerivative  = 0;
    let secondDerivative = 0;

    for (const { correct, params } of responses) {
      const p = icc(theta, params);
      const q = 1 - p;
      const { a, c } = params;
      const w = (p - c) / (1 - c);

      const d1 = D * a * w * (correct ? q / p : -1);
      firstDerivative  += d1;
      secondDerivative -= D * D * a * a * w * w * (q / p);
    }

    if (secondDerivative === 0) break;
    const step = firstDerivative / secondDerivative;
    theta -= step;

    // clamp to [-4, 4]
    theta = Math.max(-4, Math.min(4, theta));

    if (Math.abs(step) < 1e-6) break;
  }

  return theta;
}

export function computeSE(
  theta: number,
  allParams: IrtParams[]
): number {
  const info = allParams.reduce((sum, p) => sum + itemInformation(theta, p), 0);
  return info > 0 ? 1 / Math.sqrt(info) : 99;
}

/**
 * Select next question: maximum Fisher information at current theta
 */
export function selectNextQuestion(
  theta: number,
  candidates: { id: string; params: IrtParams }[]
): string | null {
  if (!candidates.length) return null;

  let best = candidates[0];
  let bestInfo = itemInformation(theta, best.params);

  for (const q of candidates.slice(1)) {
    const info = itemInformation(theta, q.params);
    if (info > bestInfo) {
      bestInfo = info;
      best = q;
    }
  }

  return best.id;
}

export function shouldTerminate(se: number, answeredCount: number, minQuestions = 10): boolean {
  return answeredCount >= minQuestions && se < 0.3;
}

export function classifyTheta(theta: number): IrtAbility['tier'] {
  if (theta >= 2.0)  return 'Expert';
  if (theta >= 0.5)  return 'Proficient';
  if (theta >= -0.5) return 'Competent';
  if (theta >= -2.0) return 'Developing';
  return 'Novice';
}

export function buildAbility(theta: number, se: number): IrtAbility {
  return { theta, se, tier: classifyTheta(theta) };
}
