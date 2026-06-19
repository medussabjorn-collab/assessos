import { LeadershipIndexService } from './leadership-index.service';

describe('LeadershipIndexService', () => {
  const svc = new LeadershipIndexService();

  describe('calculateLeadershipIndex', () => {
    it('throws when no dimension scores are provided', () => {
      expect(() => svc.calculateLeadershipIndex({})).toThrow(
        'No dimension scores provided',
      );
    });

    it('computes the weighted index and tier for strong scores', () => {
      const result = svc.calculateLeadershipIndex({
        vision: 4,
        execution: 4,
        people: 4,
        emotional_intelligence: 4,
      });
      // all equal scores -> weighted average equals the score
      expect(result.leadershipIndex).toBeCloseTo(4, 5);
      expect(result.tier).toBe('strong');
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.developmentAreas).toHaveLength(0);
    });

    it('flags development areas for low scores and classifies emerging', () => {
      const result = svc.calculateLeadershipIndex({
        vision: 2,
        execution: 2,
        people: 2,
      });
      expect(result.tier).toBe('emerging');
      expect(result.developmentAreas.length).toBeGreaterThan(0);
      expect(result.strengths).toHaveLength(0);
      expect(result.successorReadiness).toBeLessThanOrEqual(100);
      expect(result.successorReadiness).toBeGreaterThanOrEqual(0);
    });

    it('classifies exceptional at the top of the scale', () => {
      const result = svc.calculateLeadershipIndex({
        vision: 5,
        execution: 5,
        people: 5,
      });
      expect(result.tier).toBe('exceptional');
      expect(result.successorReadiness).toBe(100);
    });
  });

  describe('assignSuccessionTier', () => {
    it.each([
      [85, 'ready_now'],
      [70, 'ready_2yr'],
      [50, 'ready_5yr'],
      [10, 'not_ready'],
    ])('maps readiness %i to %s', (readiness, tier) => {
      expect(svc.assignSuccessionTier(readiness as number)).toBe(tier);
    });
  });

  describe('calculateOrgHealth', () => {
    it('returns a no-data result for an empty array', () => {
      const health = svc.calculateOrgHealth([]);
      expect(health.healthRating).toBe('No data');
      expect(health.avgIndex).toBe(0);
    });

    it('computes average, median and distribution', () => {
      const health = svc.calculateOrgHealth([4.6, 3.8, 2.0, 3.0]);
      expect(health.avgIndex).toBeCloseTo(3.35, 2);
      expect(health.medianIndex).toBeCloseTo(3.4, 5);
      expect(health.distribution.exceptional).toBe(1);
      expect(health.distribution.strong).toBe(1);
      expect(health.distribution.emerging).toBe(1);
      expect(typeof health.healthRating).toBe('string');
    });
  });
});
