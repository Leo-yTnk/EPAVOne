import { swiftOfficialProducts } from './swiftOfficialProducts.js';
import { normalizeImportText, parseCatalogWorkbook } from './importParser.js';
import { reviewCatalogImport } from './importReview.js';
const slug = (value) =>
  normalizeImportText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
export function prepareSwiftBundle(context) {
  const products = swiftOfficialProducts.map((row) => {
    const category = (context.categories || []).find((item) => item.type === 'proteina' && slug(item.name) === slug(row.categoria));
    return { ...row, categoria: category?.name || row.categoria };
  });
  const categories = [...new Set(products.map((row) => row.categoria))]
    .filter((name) => !(context.categories || []).some((item) => item.type === 'proteina' && slug(item.name) === slug(name)))
    .map((name) => ({ tipo: 'proteina', nome: name }));
  const sheets = {
    Categorias: categories,
    Produtos: products,
    Receitas: [],
    Seções: [],
    'Receitas por Seção': [],
    'Produtos por Seção': []
  };
  const payload = parseCatalogWorkbook({ SheetNames: Object.keys(sheets), Sheets: sheets }, context);
  const review = reviewCatalogImport(payload, context);
  const retained = review.groups.products.filter((item) => item.status !== 'ignored').map((item) => item.row);
  return {
    ...payload,
    products: retained,
    categories: payload.categories.filter((category) => retained.some((item) => slug(item.category) === slug(category.name))),
    skipped: products.length - retained.length
  };
}
