import { expect, it } from 'vitest';
import { squirclePath } from '../src/design-system/behaviors/squirclePath.js';
it('keeps the contour inside its actual size even when a radius exceeds a small surface', () => {
  for (const [width, height, radius] of [
    [300, 180, 20],
    [38, 38, 900],
    [100, 40, 18],
    [4, 4, 10],
    [300, 200, 0]
  ]) {
    const path = squirclePath(width, height, radius);
    expect(path.endsWith(' Z')).toBe(true);
    const numbers = path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(1);
      expect(numbers[i]).toBeLessThanOrEqual(width + 1);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(1);
      expect(numbers[i + 1]).toBeLessThanOrEqual(height + 1);
    }
  }
  expect(squirclePath(0, 20, 10)).toBe('');
});
