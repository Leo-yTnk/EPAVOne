import { matchText } from './matchText.js';
const code = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/^0+(?=\d)/, '');
const aliases = {
  cong: 'congelado',
  congelados: 'congelado',
  congelada: 'congelado',
  congeladas: 'congelado',
  temp: 'temperado',
  temperada: 'temperado',
  unid: 'un',
  unidades: 'un'
};
const ignore = new Set(['de', 'da', 'do', 'das', 'dos', 'swift', 'pacote', 'pct', 'embalagem']);
export function productSignature(name) {
  const measures = [];
  const packs = [];
  let text = matchText(name)
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/s\s*\/\s*osso/g, 'sem osso')
    .replace(/c\s*\/\s*osso/g, 'com osso')
    .replace(/s\s*\/\s*pele/g, 'sem pele')
    .replace(/c\s*\/\s*pele/g, 'com pele')
    .replace(/\bdesossad[oa]s?\b/g, 'sem osso');
  const qualifiers = Object.fromEntries(
    [...text.matchAll(/\b(sem|com|zero)\s+(osso|pele|sal|lactose|gluten|acucar)\b/g)].map((m) => [
      m[2],
      m[1] === 'com' ? 'with' : 'without'
    ])
  );
  text = text.replace(/(\d+)\s*[x×]\s*(?=\d)/g, (_all, n) => {
    packs.push(Number(n));
    return ' ';
  });
  text = text.replace(/(\d+(?:\.\d+)?)\s*(kg|gramas?|g|ml|litros?|l|unidades?|unid\.?|un)\b/g, (_all, raw, unit) => {
    const kind = /^(kg|g|grama)/.test(unit) ? 'g' : /^(ml|l)/.test(unit) ? 'ml' : 'un';
    const factor = unit === 'kg' || /^(l|litro|litros)$/.test(unit) ? 1000 : 1;
    measures.push(`${kind}:${Math.round(Number(raw) * factor * 1000) / 1000}`);
    return ' ';
  });
  const tokens = [
    ...new Set(
      text
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((t) => aliases[t] || t)
        .filter((t) => !ignore.has(t))
    )
  ].sort();
  return { tokens, qualifiers, measures: measures.sort().join('|'), packs: packs.sort((a, b) => a - b).join('|') };
}
function incompatible(a, b) {
  if (a.measures && b.measures && a.measures !== b.measures) return true;
  if (a.packs !== b.packs) return true;
  for (const key of Object.keys(a.qualifiers)) {
    if (b.qualifiers[key] && a.qualifiers[key] !== b.qualifiers[key]) return true;
  }
  for (const group of [
    ['frango', 'bovino', 'suino', 'tilapia', 'salmao', 'camarao'],
    ['peito', 'coxa', 'sobrecoxa', 'asa']
  ]) {
    const left = a.tokens.filter((t) => group.includes(t));
    const right = b.tokens.filter((t) => group.includes(t));
    if (left.length && right.length && left.join('|') !== right.join('|')) return true;
  }
  return false;
}
export function matchProduct(product, products) {
  // YPR is an internal catalog identifier, not a Swift SKU.
  const raw = code(product.product_code || product.code);
  const identity = /^YPR[-_]/.test(raw) ? '' : raw;
  const source = productSignature(product.name);
  const byCode = identity ? products.filter((item) => code(item.code) === identity) : [];
  const candidates = byCode.filter((item) => !incompatible(source, productSignature(item.name)));
  if (byCode.length)
    return {
      reason: candidates.length ? 'code' : 'conflict',
      candidates,
      requiresChoice: candidates.length !== 1,
      explanation: candidates.length
        ? 'Mesmo código do produto; confira a apresentação.'
        : 'O código coincide, mas peso, quantidade ou apresentação divergem.'
    };
  const eligible = products.filter((item) => !identity || !code(item.code));
  const exact = eligible.filter((item) => matchText(product.name) && matchText(item.name) === matchText(product.name));
  if (exact.length)
    return { reason: 'name', candidates: exact, requiresChoice: exact.length !== 1, explanation: 'Nome completo correspondente.' };
  const ranked = eligible
    .filter((item) => {
      const target = productSignature(item.name);
      return source.tokens.length >= 2 && source.tokens.join('|') === target.tokens.join('|') && !incompatible(source, target);
    })
    .map((item) => ({ item, complete: source.measures === productSignature(item.name).measures }));
  ranked.sort((a, b) => Number(b.complete) - Number(a.complete));
  return {
    reason: ranked.length ? 'normalized' : 'missing',
    candidates: ranked.map((row) => row.item),
    requiresChoice: true,
    explanation: ranked.length
      ? 'Nome compatível após normalizar ordem, abreviações e medidas. Selecione e confira peso e embalagem.'
      : 'Nenhuma correspondência segura; códigos diferentes e apresentações conflitantes não são substituídos.'
  };
}
