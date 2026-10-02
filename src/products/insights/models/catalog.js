export const CATALOG_PAGE_SIZE = 24;
export const fold = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
export const money = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const positive = (value) => value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) > 0;

export function productPricing(product) {
  const regular = [
    product.regular_price_cents,
    product.price_cents,
    positive(product.price) ? Math.round(Number(product.price) * 100) : null
  ].find(positive);
  const promo =
    positive(product.promo_price_cents) &&
    regular &&
    Number(product.promo_price_cents) < Number(regular) &&
    positive(product.promo_min_quantity)
      ? Number(product.promo_price_cents)
      : null;
  return {
    regular: regular ? Number(regular) : null,
    promo,
    minimum: promo ? Number(product.promo_min_quantity) : null,
    unit:
      ['PER_KG', 'VARIABLE_WEIGHT'].includes(product.pricing_type) || String(product.price_unit).toLowerCase() === 'kg'
        ? 'kg'
        : product.unit || 'unidade',
    needsConfirmation:
      product.price_status !== 'CURRENT' ||
      !product.price_last_success_at ||
      !Number.isFinite(new Date(product.price_last_success_at).getTime()) ||
      Date.now() - new Date(product.price_last_success_at).getTime() > 86400000
  };
}

export function filterProducts(products, { query, category, promotion }) {
  const words = fold(query).trim().split(/\s+/).filter(Boolean);
  return products.filter(
    (product) =>
      (!category || product.category_id === category) &&
      (!promotion || productPricing(product).promo !== null) &&
      words.every((word) => fold(`${product.name} ${product.product_code ?? ''} ${product.category?.name ?? ''}`).includes(word))
  );
}

export function safeImage(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}
export function swiftLink(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (parsed.hostname === 'swift.com.br' || parsed.hostname.endsWith('.swift.com.br'))
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
