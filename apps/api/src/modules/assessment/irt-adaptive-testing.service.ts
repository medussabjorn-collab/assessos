import { Injectable } from '@nestjs/common';

/**
 * Graded Response Model (Samejima, 1969) IRT engine for adaptive testing.
 *
 * Why GRM and not the more commonly-cited 2PL/3PL: this platform's items
 * (question-bank.service.ts) are 5-point Likert self-report ("how
 * effectively do you...", rated 1-5), not right/wrong knowledge items.
 * Binary IRT models (2PL/3PL) assume a correct/incorrect response and don't
 * apply here — bolting one on anyway just to claim "IRT" would be using the
 * wrong tool for the data. GRM is the standard, published model for ordinal
 * polytomous responses and is what actually matches this item type.
 *
 * HONEST LIMITATION: item parameters (discrimination `a`, category
 * thresholds `b`) below are uncalibrated defaults, not empirically fit to
 * real response data — there's no historical response dataset in this
 * system to calibrate against (same missing-data blocker as #8's
 * validation study and #19's predictive models). The estimation math is
 * real and correct; the specific numbers it's given are placeholders until
 * real calibration data exists. Don't present ability estimates from this
 * as more precise than that.
 */

export interface ItemParameters {
  questionId: string;
  discrimination: number; // a
  // Category boundary thresholds, ascending, length = numCategories - 1.
  // For a 5-point Likert item: 4 thresholds.
  thresholds: number[];
}

export interface GradedResponse {
  questionId: string;
  // 0-indexed category (0-4 for a 5-point Likert item).
  category: number;
}

export interface AbilityEstimate {
  theta: number;
  standardError: number;
}

const THETA_GRID_MIN = -4;
const THETA_GRID_MAX = 4;
const THETA_GRID_STEP = 0.05;
const DEFAULT_STOPPING_SE = 0.3;
const MIN_ITEMS_BEFORE_STOPPING = 4;

@Injectable()
export class IrtAdaptiveTestingService {
  // Placeholder calibration: uniform discrimination, thresholds spread
  // symmetrically across a 5-category item's response range. Documented
  // above as uncalibrated — a real deployment needs to fit these from
  // response data (joint/marginal maximum likelihood calibration).
  defaultParametersFor(questionId: string): ItemParameters {
    return {
      questionId,
      discrimination: 1.2,
      thresholds: [-1.5, -0.5, 0.5, 1.5],
    };
  }

  private probabilityAtOrAbove(theta: number, a: number, b: number): number {
    return 1 / (1 + Math.exp(-a * (theta - b)));
  }

  categoryProbabilities(theta: number, params: ItemParameters): number[] {
    const { discrimination: a, thresholds } = params;
    // P(>=0) = 1 always; P(>= numCategories) = 0 always.
    const pAtOrAbove = [1, ...thresholds.map((b) => this.probabilityAtOrAbove(theta, a, b)), 0];
    const categoryProbs: number[] = [];
    for (let k = 0; k < pAtOrAbove.length - 1; k++) {
      categoryProbs.push(pAtOrAbove[k] - pAtOrAbove[k + 1]);
    }
    return categoryProbs;
  }

  private logLikelihood(
    theta: number,
    responses: Array<{ params: ItemParameters; category: number }>,
  ): number {
    let ll = 0;
    for (const r of responses) {
      const probs = this.categoryProbabilities(theta, r.params);
      const p = Math.max(probs[r.category] ?? 0, 1e-10);
      ll += Math.log(p);
    }
    return ll;
  }

  // Item information at theta: sum of squared-derivative / P over category
  // boundaries — standard GRM information function. Used both for ability
  // SE (via test information) and for adaptive item selection.
  itemInformation(theta: number, params: ItemParameters): number {
    const { discrimination: a, thresholds } = params;
    const pAtOrAbove = [1, ...thresholds.map((b) => this.probabilityAtOrAbove(theta, a, b)), 0];
    let information = 0;
    for (let k = 0; k < pAtOrAbove.length - 1; k++) {
      const pAbove = pAtOrAbove[k];
      const pBelow = pAtOrAbove[k + 1];
      const pCategory = pAbove - pBelow;
      if (pCategory <= 1e-10) continue;
      // Derivative of P(>=k) w.r.t. theta is a * P(>=k) * (1 - P(>=k)).
      const derivAbove = a * pAbove * (1 - pAbove);
      const derivBelow = a * pBelow * (1 - pBelow);
      const derivCategory = derivAbove - derivBelow;
      information += (derivCategory * derivCategory) / pCategory;
    }
    return information;
  }

  // Grid-search MLE: evaluate log-likelihood across a theta grid, take the
  // argmax. Deliberately not Newton-Raphson — avoids a hand-rolled
  // numerical derivative being silently wrong, at the cost of grid
  // resolution (0.05) as the precision floor. Standard error comes from
  // test information (sum of item informations) at theta_hat: SE = 1/sqrt(I).
  estimateAbility(
    responses: Array<{ params: ItemParameters; category: number }>,
  ): AbilityEstimate {
    if (responses.length === 0) {
      return { theta: 0, standardError: Infinity };
    }

    let bestTheta = 0;
    let bestLL = -Infinity;
    for (let theta = THETA_GRID_MIN; theta <= THETA_GRID_MAX; theta += THETA_GRID_STEP) {
      const ll = this.logLikelihood(theta, responses);
      if (ll > bestLL) {
        bestLL = ll;
        bestTheta = theta;
      }
    }

    const testInformation = responses.reduce(
      (sum, r) => sum + this.itemInformation(bestTheta, r.params),
      0,
    );
    const standardError = testInformation > 0 ? 1 / Math.sqrt(testInformation) : Infinity;

    return { theta: Math.round(bestTheta * 1000) / 1000, standardError: Math.round(standardError * 1000) / 1000 };
  }

  // Maximum-information item selection: among unanswered items, pick the
  // one providing the most information at the current ability estimate.
  selectNextItem(
    currentTheta: number,
    availableItems: ItemParameters[],
  ): ItemParameters | null {
    if (availableItems.length === 0) return null;

    let best = availableItems[0];
    let bestInfo = this.itemInformation(currentTheta, best);
    for (const item of availableItems.slice(1)) {
      const info = this.itemInformation(currentTheta, item);
      if (info > bestInfo) {
        best = item;
        bestInfo = info;
      }
    }
    return best;
  }

  // Standard CAT stopping rule: stop once the ability estimate's standard
  // error drops below threshold, but never before a minimum item count
  // (a single lucky/unlucky early item shouldn't end the test).
  shouldStopTesting(
    itemsAnswered: number,
    standardError: number,
    stoppingSE: number = DEFAULT_STOPPING_SE,
    minItems: number = MIN_ITEMS_BEFORE_STOPPING,
  ): boolean {
    if (itemsAnswered < minItems) return false;
    return standardError <= stoppingSE;
  }
}
