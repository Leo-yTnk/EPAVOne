import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { catalogIndex, matchAllCustomers } from '../src/shared/intelligence/catalog.js';
import { rankCustomers } from '../src/shared/intelligence/priority.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
const now = '2026-10-28';
const seed = demoData(now);
const state = {
  ...seed,
  customers: Array.from({ length: 200 }, (_, i) => ({ ...seed.customers[i % 12], id: 'c' + i, name: 'Cliente ' + i })),
  interactions: [],
  commitments: []
};
for (const c of state.customers)
  for (let i = 0; i < 20; i++)
    state.interactions.push({ id: c.id + '-' + i, customerId: c.id, date: '2026-10-01', outcome: i % 2 ? 'interested' : 'bought' });
const week = {
  id: '2026-10-26',
  goal: 8,
  queue: state.customers.slice(0, 8).map((c) => ({ customerId: c.id, role: 'primary', outcome: null }))
};
const catalog = {
  products: Array.from({ length: 1002 }, (_, i) => ({
    id: 'p' + i,
    name: 'Produto ' + i,
    category: { name: ['Aves', 'Bovinos', 'Suínos', 'Pescados', 'Padaria', 'Sobremesas', 'Vegetais'][i % 7] }
  })),
  recipes: [],
  links: []
};
for (let i = 0; i < 100; i++) {
  catalog.recipes.push({ id: 'r' + i, name: 'Receita ' + i, extras: [] });
  for (let j = 0; j < 3; j++) catalog.links.push({ recipe_id: 'r' + i, product_id: 'p' + (i * 3 + j) });
}
const rounds = [];
for (let run = 0; run < 25; run++) {
  const start = performance.now();
  const index = catalogIndex(catalog, null, now);
  const indexed = performance.now();
  const matches = matchAllCustomers(state.customers, index);
  const matched = performance.now();
  const ranked = rankCustomers(state, week, now, matches);
  rounds.push({
    indexMs: indexed - start,
    matchMs: matched - indexed,
    rankMs: performance.now() - matched,
    totalMs: performance.now() - start
  });
  if (ranked.length !== 200) throw Error('Missing customers');
}
const sorted = rounds.map((r) => r.totalMs).sort((a, b) => a - b);
const result = {
  environment: `Node ${process.version}, ${process.platform}/${process.arch}; synthetic host benchmark, not a physical tablet`,
  customers: 200,
  products: 1002,
  recipes: 100,
  interactions: 4000,
  rounds,
  medianMs: sorted[12],
  p95Ms: sorted[23]
};
fs.mkdirSync('docs/commercial-intelligence-review', { recursive: true });
fs.writeFileSync('docs/commercial-intelligence-review/performance.json', JSON.stringify(result, null, 2));
process.stdout.write(JSON.stringify({ medianMs: result.medianMs, p95Ms: result.p95Ms }) + '\n');
