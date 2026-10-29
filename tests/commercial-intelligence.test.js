import { describe, expect, it } from 'vitest';
import { rankCustomers, PRIORITY_WEIGHTS } from '../src/shared/intelligence/priority.js';
import {
  catalogIndex,
  commercialCategory,
  matchAllCustomers,
  matchCustomersInChunks,
  matchCustomerCatalog,
  recipeComplements
} from '../src/shared/intelligence/catalog.js';
import { contactGoalInsight, salesInsights } from '../src/shared/intelligence/goals.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
const now = '2026-10-28';
const fresh = () => demoData(now);
const customer = { id: 'c', name: 'Cliente', preferences: ['aves'], restrictions: [], frequencyDays: 14, intent: false };
const week = { id: '2026-10-26', queue: [] };
const state = (patch = {}) => ({ customers: [customer], interactions: [], commitments: [], weeks: [week], ...patch });
const product = (id, name, category) => ({ id, name, product_code: id, category: { name: category } });
const catalog = () => ({
  products: [product('1', 'Peito 1kg', 'Aves'), product('2', 'Batata 500g', 'Vegetais'), product('3', 'Peixe 1kg', 'Pescados')],
  recipes: [{ id: 'r', name: 'Frango com batata', extras: [] }],
  links: [
    { recipe_id: 'r', product_id: '1' },
    { recipe_id: 'r', product_id: '2' }
  ]
});
describe('commercial priority policy', () => {
  it('has a documented 100-point ceiling and never estimates a probability', () => {
    expect(Object.values(PRIORITY_WEIGHTS).reduce((a, b) => a + b)).toBe(100);
    expect(rankCustomers(state(), week, now)[0]).toMatchObject({ score: null, insufficient: 'Dados insuficientes para pontuar' });
  });
  it('does not turn missing frequency/history into recency points', () => {
    const result = rankCustomers(state({ customers: [{ ...customer, intent: true, frequencyDays: null }] }), week, now)[0];
    expect(result.score).toBe(20);
    expect(result.factors[1].points).toBe(0);
  });
  it('caps historical contribution and does not reward purchase value', () => {
    const interactions = Array.from({ length: 10 }, (_, id) => ({
      id: String(id),
      customerId: 'c',
      date: '2026-10-10',
      outcome: 'bought',
      amountCents: 999999
    }));
    const a = rankCustomers(state({ interactions: interactions.slice(0, 1) }), week, now)[0];
    const b = rankCustomers(state({ interactions }), week, now)[0];
    expect(a.score).toBe(b.score);
    expect(b.factors[4].points).toBe(5);
  });
  it('prioritizes a dated followup without requiring purchase history', () => {
    const result = rankCustomers(
      state({ commitments: [{ id: 'p', customerId: 'c', due: now, text: 'Retomar almoço', done: false }] }),
      week,
      now
    )[0];
    expect(result.score).toBe(30);
    expect(result.reason).toContain('Retomar almoço');
    expect(result.action).toMatchObject({ kind: 'followup', href: '#/planner/clientes/c/combinados' });
  });
  it('ignores invalid/future contacts, invalid commitments, orphans and unavailable attempts', () => {
    const interactions = ['2026-02-30', '2026-10-29', 'bad', now].map((date, i) => ({
      customerId: 'c',
      date,
      outcome: i === 3 ? 'unavailable' : 'bought'
    }));
    interactions.push({ customerId: 'other', date: now, outcome: 'bought' });
    const result = rankCustomers(state({ interactions, commitments: [{ customerId: 'c', due: 'bad', done: false }] }), week, now)[0];
    expect(result.score).toBeNull();
  });
  it('uses selected week, never reorders the manual queue, and explains completion penalty', () => {
    const s = fresh(),
      saved = structuredClone(s);
    const current = rankCustomers(s, s.weeks[0], now);
    const future = rankCustomers(s, { ...week, id: '2026-11-02' }, now);
    expect(current.find((r) => r.customerId === 'demo-1').score - future.find((r) => r.customerId === 'demo-1').score).toBe(10);
    expect(s).toEqual(saved);
    expect(
      rankCustomers(s, { ...week, queue: [{ customerId: 'demo-1', outcome: 'interested' }] }, now)
        .find((r) => r.customerId === 'demo-1')
        .factors.at(-1).points
    ).toBe(-40);
  });
  it('keeps refusals and future agreed returns out of proactive contact suggestions', () => {
    for (const outcome of ['declined', 'later']) {
      const result = rankCustomers(
        state({
          interactions: [{ id: 'i', customerId: 'c', date: now, outcome }],
          commitments: [{ customerId: 'c', due: '2026-11-01', text: 'Retomar', done: false }]
        }),
        week,
        now
      )[0];
      expect(result.deferred).toBe(true);
      expect(result.action.kind).toBe('profile');
    }
  });
  it('gives stable ties by name then ID even if source order changes', () => {
    const customers = [
      { ...customer, id: 'b' },
      { ...customer, id: 'a' }
    ];
    expect(rankCustomers(state({ customers }), week, now).map((r) => r.customerId)).toEqual(['a', 'b']);
    expect(rankCustomers(state({ customers: customers.reverse() }), week, now).map((r) => r.customerId)).toEqual(['a', 'b']);
  });
  it('is deterministic and does not retain any previous workspace', () => {
    const s = fresh();
    expect(rankCustomers(s, s.weeks[0], now)).toEqual(rankCustomers(structuredClone(s), structuredClone(s.weeks[0]), now));
    rankCustomers(s, s.weeks[0], now);
    expect(rankCustomers(state({ customers: [] }), week, now)).toEqual([]);
  });
});
describe('catalog evidence and restrictions', () => {
  it('only recognizes explicit taxonomy, never free text or invented categories', () => {
    expect(commercialCategory('Suínos')).toBe('suínos');
    expect(commercialCategory('Coisas gostosas')).toBeNull();
    const c = catalog();
    c.products[0].category.name = 'Desconhecida';
    expect(matchCustomerCatalog(customer, catalogIndex(c, null, now)).products).toEqual([]);
  });
  it('requires a positive preference and always excludes restricted categories', () => {
    const index = catalogIndex(catalog(), null, now);
    expect(matchCustomerCatalog({ ...customer, preferences: [] }, index).products).toEqual([]);
    expect(matchCustomerCatalog({ ...customer, restrictions: ['aves'] }, index).products).toEqual([]);
    expect(matchCustomerCatalog({ ...customer, restrictions: ['complementos'] }, index).recipes).toEqual([]);
  });
  it('rejects complete recipes with a missing, unknown, unavailable or restricted ingredient', () => {
    for (const patch of [
      { id: '2', active: false },
      { id: '2', category: { name: 'Desconhecida' } },
      { id: '2', available: false },
      { id: '2', scope: 'personal' }
    ]) {
      const c = catalog();
      c.products[1] = { ...c.products[1], ...patch };
      expect(matchCustomerCatalog(customer, catalogIndex(c, null, now)).recipes).toEqual([]);
    }
    const c = catalog();
    c.links.push({ recipe_id: 'r', product_id: 'missing' });
    expect(matchCustomerCatalog(customer, catalogIndex(c, null, now)).recipes).toEqual([]);
  });
  it('does not clear unclassified recipe extras when a customer has restrictions', () => {
    const c = catalog();
    c.recipes[0].extras = ['Ingrediente externo'];
    expect(matchCustomerCatalog({ ...customer, restrictions: ['pescados'] }, catalogIndex(c, null, now)).recipes).toEqual([]);
  });
  it('separates workbook evidence from unknown availability and never promises stock or promotions', () => {
    const t = {
      filename: 'atual.xlsx',
      period: { start: '2026-10-26', end: '2026-11-01' },
      products: [{ name: 'Peito 1kg', code: '01', price: 10 }]
    };
    const current = matchCustomerCatalog(customer, catalogIndex(catalog(), t, now));
    expect(current.products[0].availability).toContain('Consta no Excel vigente');
    expect(current.products[0].availability).toContain('estoque a confirmar');
    expect(matchCustomerCatalog(customer, catalogIndex(catalog(), t, '2026-11-02')).products[0].availability).toContain('desconhecida');
    t.products[0].name = 'Peito 2kg';
    expect(matchCustomerCatalog(customer, catalogIndex(catalog(), t, now)).products[0].availability).toContain('desconhecida');
    t.products[0].name = 'Peito 1kg';
    t.products[0].price = null;
    expect(matchCustomerCatalog(customer, catalogIndex(catalog(), t, now)).products[0].availability).toContain('desconhecida');
  });
  it('only complements a selected product through a real recipe and deduplicates missing ingredients', () => {
    const matches = matchCustomerCatalog(customer, catalogIndex(catalog(), null, now));
    expect(recipeComplements(matches, [])).toEqual([]);
    expect(recipeComplements(matches, ['1']).map((r) => r.product.id)).toEqual(['2']);
    expect(recipeComplements(matches, ['1', '2'])).toEqual([]);
  });
  it('shares work for equal profiles, without caching private data globally', () => {
    const index = catalogIndex(catalog(), null, now);
    const result = matchAllCustomers([customer, { ...customer, id: 'other' }], index);
    expect(result.get('c')).toBe(result.get('other'));
    expect(matchAllCustomers([{ ...customer, restrictions: ['aves'] }], index).get('c').products).toEqual([]);
  });
});
describe('goal interpretation', () => {
  it('uses the actual configured contact goal and makes no invented sales target', () => {
    expect(contactGoalInsight({ attended: 2, goal: 7, plannedRemaining: 3 }).reason).toContain('Faltam 5');
    expect(contactGoalInsight({ attended: 0 }).title).toContain('não informada');
    expect(salesInsights([])[0].reason).toContain('Sem vendas');
  });
  it('explains distinct-product IPC, gross, TM, positivity and incomplete records using the existing ledger', () => {
    const order = { customer: { name: 'Ana' }, lines: [{ name: 'Frango', quantity: 5, unitPrice: 10 }], shippingCents: 0 };
    const result = salesInsights([{ value: 50, details: { order_data: order } }]);
    expect(result[0].reason).toContain('IPC de 1.00');
    expect(result[0].reason).toContain('não classificamos');
    expect(salesInsights([{ value: 10 }])[0].reason).toContain('1 venda(s) sem detalhes');
  });
});

it('yields the UI between bounded batches and cancels obsolete analysis', async () => {
  const index = catalogIndex(catalog(), null, now);
  const customers = Array.from({ length: 30 }, (_, i) => ({ ...customer, id: String(i) }));
  let ticks = 0,
    yields = 0,
    cancelled = false;
  const options = {
    clock: () => ticks++,
    budgetMs: 3,
    yieldTask: async () => {
      yields++;
    }
  };
  const asynchronous = await matchCustomersInChunks(customers, index, options);
  expect(asynchronous).toEqual(matchAllCustomers(customers, index));
  expect(yields).toBeGreaterThan(0);
  expect(
    await matchCustomersInChunks(customers, index, {
      ...options,
      cancelled: () => cancelled,
      yieldTask: async () => {
        cancelled = true;
      }
    })
  ).toBeNull();
});

it('never treats missing or internal product codes as workbook availability evidence', () => {
  for (const code of [undefined, '', 'YPR-001']) {
    const c = catalog();
    c.products[0].product_code = code;
    const t = { period: { start: now, end: now }, products: [{ name: 'Peito 1kg', code, price: 10 }] };
    expect(matchCustomerCatalog(customer, catalogIndex(c, t, now)).products[0].availability).toContain('desconhecida');
  }
});
