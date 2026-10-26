import { matchProduct, productSignature } from './productMatching.js';
import { matchText } from './matchText.js';
export function recipeRows(request, products) {
  return request.items.map((item, index) => {
    const match = matchProduct(item, products);
    const countUnit = /^(pacote|pacotes|unidade|unidades|un|pc)$/.test(matchText(item.unit));
    let suggestedQuantity = countUnit && Number.isFinite(item.quantity) && item.quantity > 0 ? Math.ceil(item.quantity) : '';
    const units = { kg: ['g', 1000], g: ['g', 1], l: ['ml', 1000], ml: ['ml', 1] };
    const measure = units[matchText(item.unit)];
    if (!countUnit && measure && match.candidates.length === 1) {
      const signature = productSignature(match.candidates[0].name);
      const pack = new RegExp(`^${measure[0]}:([0-9.]+)$`).exec(signature.measures);
      if (pack && !signature.packs && Number(pack[1]) > 0 && item.quantity > 0)
        suggestedQuantity = Math.ceil((item.quantity * measure[1]) / Number(pack[1]));
    }
    return {
      ...item,
      key: String(index),
      match,
      suggestedQuantity
    };
  });
}
export function recipeLines(rows, selections) {
  const quantities = new Map();
  for (const row of rows) {
    const selection = selections[row.key] || {};
    if (selection.skip) continue;
    const name = selection.name ?? (!row.match.requiresChoice && row.match.candidates.length === 1 ? row.match.candidates[0].name : '');
    const product = row.match.candidates.find((item) => item.name === name);
    const quantity = Number(selection.quantity ?? row.suggestedQuantity);
    if (!product || !Number.isFinite(product.price) || product.price <= 0) throw new Error(`Confira o produto: ${row.name}.`);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999)
      throw new Error(`Confira a quantidade de embalagens: ${row.name}.`);
    const combined = (quantities.get(name) || 0) + quantity;
    if (combined > 9999) throw new Error('A quantidade total de um produto ultrapassa 9999.');
    quantities.set(name, combined);
  }
  if (!quantities.size) throw new Error('Selecione pelo menos um produto da receita.');
  return [...quantities].map(([name, quantity]) => ({ name, quantity, kit: false }));
}
export function mergeOrderLines(current, additions) {
  const lines = current.map((line) => ({ ...line }));
  for (const addition of additions) {
    const existing = lines.find((line) => line.name === addition.name);
    if (existing) existing.quantity += addition.quantity;
    else lines.push({ ...addition });
  }
  if (lines.some((line) => !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 9999))
    throw new Error('A quantidade total de um produto ultrapassa 9999. Revise o carrinho.');
  return lines;
}
