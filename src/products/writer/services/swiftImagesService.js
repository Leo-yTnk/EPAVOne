import { requestJson } from '../../../shared/services/http.js';

const cache = new Map();
export async function findSwiftImage(product, signal) {
  if (!product.code || !/^\d+$/.test(product.code)) return null;
  if (cache.has(product.code)) return cache.get(product.code);
  try {
    const url = `https://www.swift.com.br/api/catalog_system/pub/products/search?fq=${encodeURIComponent(`alternateIds_RefId:${product.code}`)}`;
    const data = await requestJson(url, { signal });
    for (const result of Array.isArray(data) ? data : []) {
      for (const item of result.items ?? []) {
        const matches = (item.referenceId ?? []).some((reference) => String(reference.Value) === product.code);
        const image = item.images?.[0]?.imageUrl;
        if (matches && image && /^https:\/\/(?:[^/]+\.)?(?:vteximg\.com\.br|vtexassets\.com)\//.test(image)) {
          cache.set(product.code, image);
          return image;
        }
      }
    }
    cache.set(product.code, null);
  } catch {
    // A missing image or CORS/network failure must never prevent placing an order.
  }
  return null;
}
