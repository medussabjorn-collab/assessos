import { ThreePlIrtService, IrtParams } from './three-pl-irt.service';

describe('ThreePlIrtService', () => {
  const irt = new ThreePlIrtService();
  const mid: IrtParams = { a: 1, b: 0, c: 0.2 };

  it('icc is monotonic in theta and bounded by [c, 1]', () => {
    const low = irt.icc(-3, mid);
    const high = irt.icc(3, mid);
    expect(low).toBeGreaterThanOrEqual(mid.c - 1e-9);
    expect(high).toBeLessThanOrEqual(1);
    expect(high).toBeGreaterThan(low);
  });

  it('estimateTheta rises with more correct answers, falls with wrong', () => {
    const items = Array.from({ length: 12 }, () => ({ params: mid }));
    const allCorrect = items.map((i) => ({ correct: true, params: i.params }));
    const allWrong = items.map((i) => ({ correct: false, params: i.params }));
    expect(irt.estimateTheta(allCorrect)).toBeGreaterThan(1);
    expect(irt.estimateTheta(allWrong)).toBeLessThan(-1);
  });

  it('theta stays within [-4, 4]', () => {
    const items = Array.from({ length: 30 }, () => ({ correct: true, params: mid }));
    expect(irt.estimateTheta(items)).toBeLessThanOrEqual(4);
  });

  it('computeSE decreases as more informative items are added', () => {
    const seFew = irt.computeSE(0, [mid, mid]);
    const seMany = irt.computeSE(0, Array(20).fill(mid));
    expect(seMany).toBeLessThan(seFew);
  });

  it('selectNextQuestion picks the max-information item at theta', () => {
    // At theta=0, the item with difficulty nearest 0 is most informative.
    const candidates = [
      { id: 'far', params: { a: 1, b: 3, c: 0.2 } },
      { id: 'near', params: { a: 1, b: 0, c: 0.2 } },
    ];
    expect(irt.selectNextQuestion(0, candidates)).toBe('near');
    expect(irt.selectNextQuestion(0, [])).toBeNull();
  });

  it('shouldTerminate requires both min questions and low SE', () => {
    expect(irt.shouldTerminate(0.2, 12)).toBe(true);
    expect(irt.shouldTerminate(0.2, 5)).toBe(false); // too few
    expect(irt.shouldTerminate(0.5, 12)).toBe(false); // SE too high
  });

  it('classifyTheta maps to the expected tiers', () => {
    expect(irt.classifyTheta(2.5)).toBe('Expert');
    expect(irt.classifyTheta(1.0)).toBe('Proficient');
    expect(irt.classifyTheta(0.0)).toBe('Competent');
    expect(irt.classifyTheta(-1.0)).toBe('Developing');
    expect(irt.classifyTheta(-3.0)).toBe('Novice');
  });
});
