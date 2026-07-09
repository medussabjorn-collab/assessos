import { Injectable } from '@nestjs/common';

// Ported verbatim (as a service) from leadership-assessment's irtService.
//
// This is the 3-Parameter Logistic (3PL) BINARY model — for correct/incorrect
// items, which is exactly what the Mongo question bank stores (correctIndex +
// difficulty/discrimination/guessing = b/a/c). It is deliberately SEPARATE from
// assessos's GRM engine (assessment/irt-adaptive-testing.service.ts), which
// models graded/Likert responses for the pillar/dimension leadership items.
// The two coexist because they serve different item types — not duplicates.

const D = 1.702; // logistic scaling constant

export interface IrtParams {
  a: number; // discrimination
  b: number; // difficulty
  c: number; // guessing
}

export type IrtTier = 'Novice' | 'Developing' | 'Competent' | 'Proficient' | 'Expert';

export interface IrtAbility {
  theta: number;
  se: number;
  tier: IrtTier;
}

@Injectable()
export class ThreePlIrtService {
  // Item characteristic curve: P(correct | theta).
  icc(theta: number, { a, b, c }: IrtParams): number {
    return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
  }

  // Fisher information of an item at theta.
  itemInformation(theta: number, params: IrtParams): number {
    const p = this.icc(theta, params);
    const { a, c } = params;
    const q = 1 - p;
    return D * D * a * a * (((p - c) / (1 - c)) ** 2) * (q / p);
  }

  // MLE theta via Newton-Raphson (20 iters, clamped to [-4, 4]).
  estimateTheta(
    responses: { correct: boolean; params: IrtParams }[],
    initialTheta = 0,
  ): number {
    let theta = initialTheta;
    for (let iter = 0; iter < 20; iter++) {
      let firstDerivative = 0;
      let secondDerivative = 0;
      for (const { correct, params } of responses) {
        const p = this.icc(theta, params);
        const q = 1 - p;
        const { a, c } = params;
        const w = (p - c) / (1 - c);
        firstDerivative += D * a * w * (correct ? q / p : -1);
        secondDerivative -= D * D * a * a * w * w * (q / p);
      }
      if (secondDerivative === 0) break;
      const step = firstDerivative / secondDerivative;
      theta -= step;
      theta = Math.max(-4, Math.min(4, theta));
      if (Math.abs(step) < 1e-6) break;
    }
    return theta;
  }

  computeSE(theta: number, allParams: IrtParams[]): number {
    const info = allParams.reduce((sum, p) => sum + this.itemInformation(theta, p), 0);
    return info > 0 ? 1 / Math.sqrt(info) : 99;
  }

  // Next item = maximum Fisher information at current theta.
  selectNextQuestion(
    theta: number,
    candidates: { id: string; params: IrtParams }[],
  ): string | null {
    if (!candidates.length) return null;
    let best = candidates[0];
    let bestInfo = this.itemInformation(theta, best.params);
    for (const q of candidates.slice(1)) {
      const info = this.itemInformation(theta, q.params);
      if (info > bestInfo) {
        bestInfo = info;
        best = q;
      }
    }
    return best.id;
  }

  shouldTerminate(se: number, answeredCount: number, minQuestions = 10): boolean {
    return answeredCount >= minQuestions && se < 0.3;
  }

  classifyTheta(theta: number): IrtTier {
    if (theta >= 2.0) return 'Expert';
    if (theta >= 0.5) return 'Proficient';
    if (theta >= -0.5) return 'Competent';
    if (theta >= -2.0) return 'Developing';
    return 'Novice';
  }

  buildAbility(theta: number, se: number): IrtAbility {
    return { theta, se, tier: this.classifyTheta(theta) };
  }
}
