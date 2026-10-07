import { swiftOfficialProducts } from './swiftOfficialProducts.js';
import { normalizeImportText, parseCatalogWorkbook } from './importParser.js';
const normalize = normalizeImportText;
const slug = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const urlKey = (value) => {
  try {
    const url = new URL(value);
    return url.pathname
      .replace(/^\/detail\//, '/')
      .replace(/\/p\/?$/, '')
      .replace(/\/$/, '');
  } catch {
    return '';
  }
};
export function prepareSwiftBundle(context) {
  // Include inactive rows in duplicate checks to avoid reviving archived records.
  const existing = context.products || [];
  const products = swiftOfficialProducts
    .filter(
      (row) =>
        !existing.some((item) => normalize(item.name) === normalize(row.nome) || urlKey(item.swift_product_url) === urlKey(row.swift_url))
    )
    .map((row) => {
      const category = (context.categories || []).find(
        (item) => item.active !== false && item.type === 'proteina' && slug(item.name) === slug(row.categoria)
      );
      return { ...row, categoria: category?.name || row.categoria };
    });
  const categories = [...new Set(products.map((row) => row.categoria))]
    .filter(
      (name) =>
        !(context.categories || []).some((item) => item.active !== false && item.type === 'proteina' && slug(item.name) === slug(name))
    )
    .map((name) => ({ tipo: 'proteina', nome: name }));
  const sheets = {
    Categorias: categories,
    Produtos: products,
    Receitas: [],
    Seções: [],
    'Receitas por Seção': [],
    'Produtos por Seção': []
  };
  return {
    ...parseCatalogWorkbook({ SheetNames: Object.keys(sheets), Sheets: sheets }, context),
    skipped: swiftOfficialProducts.length - products.length
  };
}
