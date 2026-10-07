import { normalizeImportText } from './importParser.js';
export const importGroups = [
  ['categories', 'Categorias'],
  ['products', 'Produtos'],
  ['recipes', 'Receitas'],
  ['sections', 'Seções'],
  ['recipeSections', 'Receitas por Seção'],
  ['productSections', 'Produtos por Seção']
];
export const addModes = Object.freeze(Object.fromEntries(importGroups.map(([key]) => [key, 'add'])));
const normalize = normalizeImportText;
const slug = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
export function swiftIdentity(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['www.swift.com.br', 'swift.com.br'].includes(url.hostname)) return '';
    return url.pathname
      .toLowerCase()
      .replace(/^\/detail\//, '/')
      .replace(/\/p\/?$/, '')
      .replace(/\/+$/, '');
  } catch {
    return '';
  }
}
export function reviewCatalogImport(payload, context = {}) {
  const review = {};
  const errors = [...payload.errors];
  for (const [key, label] of importGroups) {
    review[key] = payload[key].map((row) => {
      let matches = [];
      let conflict = false;
      if (key === 'products') {
        const url = swiftIdentity(row.swift_product_url);
        matches = (context.products || []).filter(
          (item) =>
            normalize(item.name) === normalize(row.name) ||
            (url && swiftIdentity(item.swift_product_url) === url) ||
            (row.swift_sku && item.swift_sku && normalize(item.swift_sku) === normalize(row.swift_sku))
        );
        conflict =
          matches.length > 1 ||
          matches.some(
            (item) =>
              (url && item.swift_product_url && swiftIdentity(item.swift_product_url) !== url) ||
              (row.swift_sku && item.swift_sku && normalize(row.swift_sku) !== normalize(item.swift_sku))
          );
      } else if (key === 'categories') {
        matches = (context.categories || []).filter((item) => item.type === row.type && slug(item.name) === slug(row.name));
      } else if (key === 'recipes') {
        matches = (context.recipes || []).filter((item) => normalize(item.name) === normalize(row.name));
      } else {
        const structure = context.structure || {};
        const pageId = (structure.pages || []).find((page) => page.key === row.page)?.id;
        const section = (structure.sections || []).find((item) => item.page_id === pageId && item.slug === slug(row.name || row.section));
        if (key === 'sections') matches = section ? [section] : [];
        else if (section) {
          const recipe = key === 'recipeSections';
          const entity = (context[recipe ? 'recipes' : 'products'] || []).find(
            (item) => normalize(item.name) === normalize(row[recipe ? 'recipe' : 'product'])
          );
          matches = (structure[recipe ? 'recipes' : 'products'] || []).filter(
            (link) => link.section_id === section.id && link[recipe ? 'recipe_id' : 'product_id'] === entity?.id
          );
        }
      }
      conflict ||= matches.length > 1;
      if (conflict)
        errors.push(
          `${label}, linha ${row.source_line || '?'}: identidade ambígua de "${row.name || row.product || row.recipe}". Confira nome, swift_url e swift_sku.`
        );
      const differences = matches[0]
        ? ['name', 'image_url', 'unit', 'swift_product_url'].filter(
            (field) => row[field] && matches[0][field] && row[field] !== matches[0][field]
          )
        : [];
      return { row, status: conflict ? 'conflict' : matches.length ? 'ignored' : 'new', differences, existing: matches[0] };
    });
  }
  return {
    groups: review,
    errors,
    totals: Object.values(review)
      .flat()
      .reduce((sum, item) => ({ ...sum, [item.status]: sum[item.status] + 1 }), { new: 0, ignored: 0, conflict: 0 })
  };
}
