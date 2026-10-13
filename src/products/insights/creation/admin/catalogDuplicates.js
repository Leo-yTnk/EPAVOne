import { normalizeImportText } from './importParser.js';
import { swiftIdentity } from './importReview.js';
// Exact normalized identities are candidates, never proof to delete an item.
export function findCatalogDuplicates(context) {
  const groups = [];
  for (const entity of ['products', 'recipes', 'categories', 'sections']) {
    const rows = entity === 'sections' ? context.structure?.sections || [] : context[entity] || [];
    const parent = rows.map((_, i) => i);
    const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
    const known = new Map();
    const reasons = new Map();
    rows.forEach((item, i) => {
      const name = normalizeImportText(item.name);
      const identities = [
        [`${entity}:${entity === 'categories' ? item.type : entity === 'sections' ? item.page_id : ''}:name:${name}`, 'Nome normalizado']
      ];
      if (entity === 'products') {
        const url = swiftIdentity(item.swift_product_url);
        if (url) identities.push([`url:${url}`, 'Página Swift']);
        if (item.swift_sku) identities.push([`sku:${normalizeImportText(item.swift_sku)}`, 'SKU Swift']);
      }
      for (const [key, reason] of identities) {
        if (!name && reason === 'Nome normalizado') continue;
        if (known.has(key)) {
          parent[root(i)] = root(known.get(key));
          reasons.set(key, reason);
        } else known.set(key, i);
      }
    });
    const buckets = new Map();
    rows.forEach((item, i) => {
      const key = root(i);
      buckets.set(key, [...(buckets.get(key) || []), item]);
    });
    for (const [key, items] of buckets)
      if (items.length > 1)
        groups.push({
          entity,
          items,
          reasons: [...new Set([...reasons].filter(([identity]) => root(known.get(identity)) === key).map(([, reason]) => reason))]
        });
  }
  return groups;
}
export function importReplacementChoices(review, choices) {
  return Object.entries(choices)
    .filter(([, value]) => value === 'imported')
    .map(([key]) => {
      const [entity, index] = key.split(':');
      const duplicate = review.groups[entity]?.[Number(index)];
      if (
        !duplicate ||
        duplicate.status !== 'ignored' ||
        !duplicate.existing?.id ||
        !['products', 'recipes', 'categories', 'sections'].includes(entity)
      )
        throw new Error('Esta duplicata precisa ser revisada antes de substituir.');
      const existing = duplicate.existing;
      return {
        entity,
        index: Number(index),
        id: existing.id,
        ...(entity === 'sections' ? { updated_at: existing.updated_at ?? null } : { version: existing.version })
      };
    });
}
