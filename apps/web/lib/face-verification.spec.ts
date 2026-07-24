jest.mock('@vladmandic/face-api', () => ({
  euclideanDistance: jest.fn(),
  nets: {},
}));

import * as faceapi from '@vladmandic/face-api';
import { matchScore } from './face-verification';

describe('matchScore', () => {
  const a = new Float32Array([0]);
  const b = new Float32Array([0]);

  function scoreFor(distance: number): Promise<number> {
    (faceapi.euclideanDistance as jest.Mock).mockReturnValue(distance);
    return matchScore(a, b);
  }

  it('scores an identical descriptor pair at 1', async () => {
    expect(await scoreFor(0)).toBe(1);
  });

  it('clears FACE_MATCH_MIN (0.8) for a real confident same-person capture (distance 0.24)', async () => {
    // Measured live: two selfies of the same person a few seconds apart.
    expect(await scoreFor(0.24)).toBeCloseTo(0.84, 5);
  });

  it('scores exactly 0 at the mismatch boundary (distance 0.6)', async () => {
    expect(await scoreFor(0.6)).toBeCloseTo(0, 5);
  });

  it('clamps to 0 past the mismatch boundary rather than going negative', async () => {
    expect(await scoreFor(1.2)).toBe(0);
  });

  it('falls off faster near the boundary than near a perfect match', async () => {
    const nearPerfect = await scoreFor(0.05);
    const midway = await scoreFor(0.3);
    const nearBoundary = await scoreFor(0.55);
    expect(nearPerfect - midway).toBeLessThan(midway - nearBoundary);
  });
});
