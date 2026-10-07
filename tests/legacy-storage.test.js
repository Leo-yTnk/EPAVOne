import { describe, expect, it } from 'vitest';
import { migrateLegacyStorage, legacySummary } from '../src/shared/services/legacyStorage.js';
const storage = (values) => {
  const data = new Map(Object.entries(values));
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};
describe('legacy preservation', () => {
  it('imports theme once, keeps original data, and never overwrites newer preferences or snapshots', () => {
    const s = storage({ yourcipe_dark_v1: 'true', yourcipe_vendas_v1: '[{"valor":10}]' });
    migrateLegacyStorage(s);
    expect(s.getItem('epavone-theme')).toBe('dark');
    expect(legacySummary(s)).toEqual(['yourcipe_vendas_v1']);
    const before = s.getItem('epavone-legacy-review-v1');
    s.setItem('yourcipe_vendas_v1', '[]');
    s.setItem('epavone-theme', 'light');
    migrateLegacyStorage(s);
    expect(s.getItem('epavone-legacy-review-v1')).toBe(before);
    expect(s.getItem('epavone-theme')).toBe('light');
  });
  it('retains malformed input for review and does not read or copy auth sessions', () => {
    const s = storage({ yourcipe_recipes_v2: 'broken', 'sb-project-auth-token': 'sensitive' });
    migrateLegacyStorage(s);
    expect(s.getItem('epavone-legacy-review-v1')).not.toContain('sensitive');
    expect(s.getItem('epavone-legacy-review-v1')).toContain('broken');
  });
});
