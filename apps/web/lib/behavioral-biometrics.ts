// Pure statistics for keystroke/mouse behavioral biometrics. Deliberately
// never touches actual key characters or cursor coordinates — only numeric
// timing/velocity deltas ever flow through here, matching the minimal-data
// ethos elsewhere in this codebase (see EnvironmentScanCapture's disclosure
// comment). This module is the testable math; use-behavioral-biometrics.ts
// wires it to real DOM events.

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Standard deviations away from baseline mean. Zero-variance baseline (e.g.
// a suspiciously perfect typist, or too few samples) would divide by zero —
// treated as "no signal" (0) rather than an infinite/NaN false alarm.
export function zScore(value: number, baselineMean: number, baselineStd: number): number {
  if (baselineStd === 0) return 0;
  return (value - baselineMean) / baselineStd;
}

export interface BehavioralBaseline {
  dwellMean: number;
  dwellStd: number;
  flightMean: number;
  flightStd: number;
  velocityMean: number;
  velocityStd: number;
}

export function computeBaseline(dwellTimes: number[], flightTimes: number[], velocities: number[]): BehavioralBaseline {
  return {
    dwellMean: mean(dwellTimes),
    dwellStd: stddev(dwellTimes),
    flightMean: mean(flightTimes),
    flightStd: stddev(flightTimes),
    velocityMean: mean(velocities),
    velocityStd: stddev(velocities),
  };
}

// Combined deviation score for a comparison window against the frozen
// baseline: mean of the absolute z-scores across the three signals that have
// enough baseline variance to be meaningful (baselineStd > 0). Using the mean
// rather than the max keeps a single noisy metric from dominating, while
// still requiring most signals to have moved together for a high score.
export function deviationScore(
  windowDwellTimes: number[],
  windowFlightTimes: number[],
  windowVelocities: number[],
  baseline: BehavioralBaseline,
): number {
  const scores: number[] = [];
  if (baseline.dwellStd > 0 && windowDwellTimes.length > 0) {
    scores.push(Math.abs(zScore(mean(windowDwellTimes), baseline.dwellMean, baseline.dwellStd)));
  }
  if (baseline.flightStd > 0 && windowFlightTimes.length > 0) {
    scores.push(Math.abs(zScore(mean(windowFlightTimes), baseline.flightMean, baseline.flightStd)));
  }
  if (baseline.velocityStd > 0 && windowVelocities.length > 0) {
    scores.push(Math.abs(zScore(mean(windowVelocities), baseline.velocityMean, baseline.velocityStd)));
  }
  return mean(scores);
}
