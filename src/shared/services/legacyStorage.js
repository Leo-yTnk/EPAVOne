// Same-origin, one-time preservation. Never read Auth tokens or delete old keys.
const KEY = 'epavone-legacy-review-v1';
const KEYS = [
  'products_v1',
  'recipes_v2',
  'favorites_v1',
  'profile_v1',
  'vendas_v1',
  'hidden_v1',
  'sections_v1',
  'product_sections_v1',
  'proteins_v1',
  'week_start_v1',
  'nav_rail_side_v1',
  'font_size_v1',
  'product_layout_v1',
  'welcome_seen_v1'
];
export function migrateLegacyStorage(storage = localStorage) {
  try {
    if (storage.getItem(KEY) !== null) return;
    const records = {};
    for (const suffix of KEYS) {
      const key = `yourcipe_${suffix}`;
      const raw = storage.getItem(key);
      if (raw !== null) records[key] = raw;
    }
    const dark = storage.getItem('yourcipe_dark_v1');
    if (storage.getItem('epavone-theme') === null && ['true', 'false'].includes(dark))
      storage.setItem('epavone-theme', dark === 'true' ? 'dark' : 'light');
    storage.setItem(KEY, JSON.stringify({ version: 1, records }));
  } catch {
    // Original keys are preserved, including when storage is full/unavailable.
  }
}
export function legacySummary(storage = localStorage) {
  try {
    const snapshot = JSON.parse(storage.getItem(KEY));
    return Object.keys(snapshot?.records || {});
  } catch {
    return [];
  }
}
export function downloadLegacyReview(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) throw new Error('Nenhuma cópia local disponível.');
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'epavone-dados-locais-para-revisao.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
