import { expect, it } from 'vitest';
import { validSwiftSyncSelection } from '../supabase/functions/_shared/swift-sync-batch.js';
import { formatSyncRemaining } from '../src/products/insights/creation/services/formatSyncRemaining.js';
const ids = Array.from({ length: 7 }, (_, i) => `00000000-0000-0000-0000-00000000000${i}`);
it('bounds explicit selections and rejects malformed, duplicate or ambiguous identities', () => {
  expect(validSwiftSyncSelection({})).toBe(true);
  expect(validSwiftSyncSelection({ productId: ids[0] })).toBe(true);
  expect(validSwiftSyncSelection({ productIds: ids.slice(0, 6), productId: ids[0] })).toBe(true);
  for (const productIds of [[], ids, ['invalid'], [ids[0], ids[0]], 'not-an-array', null]) {
    expect(validSwiftSyncSelection({ productIds })).toBe(false);
  }
  expect(validSwiftSyncSelection({ productIds: [ids[0]], productId: ids[1] })).toBe(false);
});
it('formats an explicitly approximate remaining time and handles unsampled or pending requests', () => {
  expect(formatSyncRemaining(null)).toContain('calculando');
  expect(formatSyncRemaining(3000)).toBe('Tempo restante estimado: 3 s');
  expect(formatSyncRemaining(65000)).toBe('Tempo restante estimado: 2 min');
  expect(formatSyncRemaining(3660000)).toBe('Tempo restante estimado: 1 h 1 min');
  expect(formatSyncRemaining(2000, true)).toContain('aguardando confirmação');
});
