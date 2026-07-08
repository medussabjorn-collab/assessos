import { IrtAdaptiveTestingService, ItemParameters } from './irt-adaptive-testing.service';

describe('IrtAdaptiveTestingService', () => {
  let service: IrtAdaptiveTestingService;

  beforeEach(() => {
    service = new IrtAdaptiveTestingService();
  });

  describe('categoryProbabilities', () => {
    it('returns probabilities summing to 1 across all categories', () => {
      const params = service.defaultParametersFor('q1');
      const probs = service.categoryProbabilities(0, params);

      expect(probs).toHaveLength(5);
      expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      for (const p of probs) {
        expect(p).toBeGreaterThanOrEqual(0);
      }
    });

    it('shifts probability mass toward higher categories as theta increases', () => {
      const params = service.defaultParametersFor('q1');
      const lowTheta = service.categoryProbabilities(-3, params);
      const highTheta = service.categoryProbabilities(3, params);

      // At very low theta, category 0 (lowest) should dominate.
      expect(lowTheta[0]).toBeGreaterThan(0.5);
      // At very high theta, the top category should dominate.
      expect(highTheta[4]).toBeGreaterThan(0.5);
    });
  });

  describe('itemInformation', () => {
    it('is highest near the item\'s central threshold region, not at the extremes', () => {
      const params: ItemParameters = { questionId: 'q1', discrimination: 1.2, thresholds: [-1.5, -0.5, 0.5, 1.5] };

      const infoAtCenter = service.itemInformation(0, params);
      const infoAtExtreme = service.itemInformation(6, params);

      expect(infoAtCenter).toBeGreaterThan(infoAtExtreme);
    });

    it('increases with higher discrimination, holding theta and thresholds fixed', () => {
      const lowDiscrimination: ItemParameters = { questionId: 'q1', discrimination: 0.5, thresholds: [-1.5, -0.5, 0.5, 1.5] };
      const highDiscrimination: ItemParameters = { questionId: 'q1', discrimination: 2.0, thresholds: [-1.5, -0.5, 0.5, 1.5] };

      expect(service.itemInformation(0, highDiscrimination)).toBeGreaterThan(
        service.itemInformation(0, lowDiscrimination),
      );
    });
  });

  describe('estimateAbility', () => {
    it('returns theta=0 and infinite SE with no responses', () => {
      const result = service.estimateAbility([]);

      expect(result.theta).toBe(0);
      expect(result.standardError).toBe(Infinity);
    });

    it('estimates a high theta for consistently top-category responses', () => {
      const params = service.defaultParametersFor('q1');
      const responses = Array.from({ length: 6 }, (_, i) => ({
        params: { ...params, questionId: `q${i}` },
        category: 4, // top category on a 5-point (0-4) scale
      }));

      const result = service.estimateAbility(responses);

      expect(result.theta).toBeGreaterThan(1);
    });

    it('estimates a low theta for consistently bottom-category responses', () => {
      const params = service.defaultParametersFor('q1');
      const responses = Array.from({ length: 6 }, (_, i) => ({
        params: { ...params, questionId: `q${i}` },
        category: 0,
      }));

      const result = service.estimateAbility(responses);

      expect(result.theta).toBeLessThan(-1);
    });

    it('estimates near theta=0 for consistently middle-category responses', () => {
      const params = service.defaultParametersFor('q1');
      const responses = Array.from({ length: 6 }, (_, i) => ({
        params: { ...params, questionId: `q${i}` },
        category: 2, // middle category
      }));

      const result = service.estimateAbility(responses);

      expect(Math.abs(result.theta)).toBeLessThan(0.5);
    });

    it('reduces standard error as more responses are added', () => {
      const params = service.defaultParametersFor('q1');
      const oneResponse = [{ params: { ...params, questionId: 'q0' }, category: 3 }];
      const sixResponses = Array.from({ length: 6 }, (_, i) => ({
        params: { ...params, questionId: `q${i}` },
        category: 3,
      }));

      const seOne = service.estimateAbility(oneResponse).standardError;
      const seSix = service.estimateAbility(sixResponses).standardError;

      expect(seSix).toBeLessThan(seOne);
    });
  });

  describe('selectNextItem', () => {
    it('returns null when no items are available', () => {
      expect(service.selectNextItem(0, [])).toBeNull();
    });

    it('selects the item with thresholds closest to (most informative at) the current theta', () => {
      const easyItem: ItemParameters = { questionId: 'easy', discrimination: 1.2, thresholds: [-3, -2, -1, 0] };
      const hardItem: ItemParameters = { questionId: 'hard', discrimination: 1.2, thresholds: [0, 1, 2, 3] };
      const midItem: ItemParameters = { questionId: 'mid', discrimination: 1.2, thresholds: [-1.5, -0.5, 0.5, 1.5] };

      const selected = service.selectNextItem(0, [easyItem, hardItem, midItem]);

      expect(selected?.questionId).toBe('mid');
    });
  });

  describe('shouldStopTesting', () => {
    it('never stops before the minimum item count, regardless of SE', () => {
      expect(service.shouldStopTesting(2, 0.01)).toBe(false);
    });

    it('stops once SE drops to or below the threshold after the minimum item count', () => {
      expect(service.shouldStopTesting(5, 0.25)).toBe(true);
      expect(service.shouldStopTesting(5, 0.5)).toBe(false);
    });
  });
});
