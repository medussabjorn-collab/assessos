import { mean, stddev, zScore, computeBaseline, deviationScore } from './behavioral-biometrics';

describe('mean', () => {
  it('averages a set of values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns 0 for an empty array rather than NaN', () => {
    expect(mean([])).toBe(0);
  });
});

describe('stddev', () => {
  it('computes sample standard deviation', () => {
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });

  it('returns 0 for fewer than two values rather than NaN', () => {
    expect(stddev([5])).toBe(0);
    expect(stddev([])).toBe(0);
  });

  it('returns 0 for identical values (no variance)', () => {
    expect(stddev([10, 10, 10])).toBe(0);
  });
});

describe('zScore', () => {
  it('computes standard deviations from the mean', () => {
    expect(zScore(130, 100, 15)).toBeCloseTo(2, 5);
    expect(zScore(70, 100, 15)).toBeCloseTo(-2, 5);
  });

  it('returns 0 on a zero-variance baseline instead of Infinity/NaN', () => {
    expect(zScore(999, 100, 0)).toBe(0);
  });
});

describe('computeBaseline', () => {
  it('summarizes dwell/flight/velocity samples into mean+std', () => {
    const baseline = computeBaseline([80, 90, 100, 110, 120], [50, 60, 70], [200, 220, 240]);
    expect(baseline.dwellMean).toBe(100);
    expect(baseline.flightMean).toBe(60);
    expect(baseline.velocityMean).toBe(220);
    expect(baseline.dwellStd).toBeGreaterThan(0);
  });
});

describe('deviationScore', () => {
  const baseline = computeBaseline(
    [80, 90, 100, 110, 120, 95, 105, 100, 90, 110],
    [50, 60, 70, 55, 65, 60, 58, 62, 59, 61],
    [200, 220, 240, 210, 230, 215, 225, 205, 235, 220],
  );

  it('scores a window matching baseline behavior near zero', () => {
    const score = deviationScore([95, 105, 100, 90, 110], [58, 62, 60, 59, 61], [210, 225, 220, 215, 230], baseline);
    expect(score).toBeLessThan(1);
  });

  it('scores a sharply different typing/mouse pattern well above the matching case', () => {
    // Same shape as the matching-window test above but shifted ~5 baseline
    // std-devs out — simulating a handoff to a different, much slower typist.
    const matchingScore = deviationScore(
      [95, 105, 100, 90, 110],
      [58, 62, 60, 59, 61],
      [210, 225, 220, 215, 230],
      baseline,
    );
    const anomalousScore = deviationScore([400, 420, 410, 430, 405], [58, 62, 60, 59, 61], [210, 225, 220, 215, 230], baseline);
    expect(anomalousScore).toBeGreaterThan(matchingScore);
    expect(anomalousScore).toBeGreaterThan(2);
  });

  it('ignores a signal with zero baseline variance rather than blowing up the average', () => {
    const flatBaseline = computeBaseline([100, 100, 100], [60, 60, 60], [50, 100, 150]);
    // dwell/flight have zero variance in the baseline — should be excluded,
    // leaving only the velocity signal to drive the score.
    const score = deviationScore([999], [999], [50, 100, 150], flatBaseline);
    expect(score).toBe(0);
  });

  it('returns 0 when no window samples are available for any signal', () => {
    expect(deviationScore([], [], [], baseline)).toBe(0);
  });
});
