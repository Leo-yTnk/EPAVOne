import { describe, expect, it, afterEach } from 'vitest';
import { matchProduct, matchClients, orderSummary } from '../src/shared/services/orderMatching.js';
import { commercialContext } from '../src/shared/services/commercialContext.js';
import { weeklyOrder } from '../src/shared/services/weeklyOrder.js';
afterEach(() => {
  commercialContext.clear();
  weeklyOrder.attach(null);
  weeklyOrder.dismiss(weeklyOrder.get().request?.id);
});
describe('weekly order identities', () => {
  const products = [
    { code: '123', name: 'Frango 1 kg', price: 12.34 },
    { code: '456', name: 'Frango 2 kg', price: 22 }
  ];
  it('prefers a stable code despite a changed name and preserves ambiguous presentations', () => {
    expect(matchProduct({ product_code: '00123', name: 'Outro nome' }, products)).toMatchObject({
      reason: 'code',
      candidates: [products[0]]
    });
    expect(matchProduct({ code: '123' }, [...products, { code: '123', name: 'Frango unidade' }]).candidates).toHaveLength(2);
    expect(matchProduct({ name: 'Frango 3 kg' }, products).candidates).toHaveLength(0);
    expect(matchProduct({ product_code: '999', name: 'Frango 1 kg' }, products).candidates).toHaveLength(0);
  });
  it('normalizes accents and whitespace without conflating different rooms or similar names', () => {
    const clients = [
      { name: 'João  Silva', room: 'A' },
      { name: 'João Silva', room: 'B' },
      { name: 'João Pedro Silva', room: 'A' }
    ];
    expect(matchClients(' JOAO SILVA ', clients)).toMatchObject({ exact: true, candidates: clients.slice(0, 2) });
    expect(matchClients('Joao Pedro', clients)).toMatchObject({ exact: false, candidates: [clients[2]] });
    expect(matchClients('', clients).candidates).toEqual([]);
  });
  it('summarizes the workbook price, not the Insights price', () => {
    expect(
      orderSummary(
        { filename: 'week.xlsx', period: { start: '2026-10-26', end: '2026-10-30' }, products },
        { client: 'João', room: 'A', lines: [{ name: 'Frango 1 kg', quantity: 3 }] }
      )
    ).toMatchObject({ amountCents: 3702, units: 3, filename: 'week.xlsx' });
  });
  it('keeps a session on same-client navigation but invalidates exported totals on edits', () => {
    const context = commercialContext.begin({ customerId: 'a', weekId: '2026-10-26' });
    commercialContext.exported(context.id, { units: 2 });
    expect(commercialContext.begin({ customerId: 'a', weekId: '2026-10-26', query: 'frango' }).id).toBe(context.id);
    commercialContext.invalidate(context.id);
    expect(commercialContext.get()).toMatchObject({ orderStatus: 'pending', summary: null });
    const other = commercialContext.begin({ customerId: 'b' });
    commercialContext.exported(context.id, { units: 10 });
    expect(commercialContext.get()).toMatchObject({ id: other.id, orderStatus: 'pending' });
  });
  it('publishes no workbook personal data to other products', () => {
    weeklyOrder.attach({ filename: 'week.xlsx', period: {}, products, clients: [{ cpf: 'secret' }], bytes: 'private' });
    expect(weeklyOrder.get().template.clients).toBeUndefined();
    expect(weeklyOrder.get().template.bytes).toBeUndefined();
  });
});

describe('strengthened matches and review examples', () => {
  it.each([
    ['Filé de peito de frango Swift 1 kg', 'Frango — filé de peito 1000 g'],
    ['Filé de frango cong. 1,5 kg', 'Filé de frango congelado 1500g'],
    ['Sobrecoxa desossada 1 kg', 'Sobrecoxa sem osso 1000g'],
    ['Caldo de frango 1 L', 'Caldo de frango 1000 ml'],
    ['Pão de queijo pct 400 g', 'Pacote pão de queijo Swift 0,4kg']
  ])('suggests equivalent wording and measures: %s → %s', (name, target) => {
    const match = matchProduct({ name }, [{ name: target }]);
    expect(match.candidates).toHaveLength(1);
    expect(match.requiresChoice).toBe(true);
    expect(match.reason).toBe('normalized');
  });
  it.each([
    ['Filé de frango 1kg', 'Filé de frango 2kg'],
    ['Filé de frango 1kg', 'Filé de frango 2x500g'],
    ['Filé de frango sem osso 1kg', 'Filé de frango com osso 1kg'],
    ['Frango com pele sem osso 1kg', 'Frango sem pele com osso 1kg'],
    ['Filé de frango 1kg', 'Filé de tilápia 1kg'],
    ['Peito de frango 1kg', 'Coxa de frango 1kg']
  ])('blocks conflicting presentations even when the code is equal: %s → %s', (name, target) => {
    expect(matchProduct({ name, product_code: '123' }, [{ name: target, code: '123' }])).toMatchObject({
      reason: 'conflict',
      candidates: []
    });
  });
  it('does not reject identical mixed qualifiers and keeps missing weights as suggestions', () => {
    expect(
      matchProduct({ name: 'Frango com pele sem osso 1kg', product_code: '123' }, [{ name: 'Frango com pele sem osso 1kg', code: '123' }])
        .candidates
    ).toHaveLength(1);
    const result = matchProduct({ name: 'Filé de frango' }, [{ name: 'Filé de frango 1kg' }, { name: 'Filé de frango 2kg' }]);
    expect(result.candidates).toHaveLength(2);
    expect(result.requiresChoice).toBe(true);
  });
  it.each([
    ['João P. Silva', 'João Pedro Silva'],
    ['Leonadro Tanaka', 'Leonardo Tanaka'],
    ['Maria Silva', 'Maria Aparecida da Silva']
  ])('suggests but never automatically selects a client: %s → %s', (name, target) => {
    expect(matchClients(name, [{ name: target, room: 'A' }])).toMatchObject({ exact: false, candidates: [{ name: target, room: 'A' }] });
  });
  it.each([
    ['João Silva', 'José Silva'],
    ['Maria', 'Maria Silva'],
    ['João P. Silva', 'João Carlos Silva'],
    ['Ana Silva Silva', 'Ana Silva']
  ])('does not suggest unrelated or insufficient names: %s → %s', (name, target) => {
    expect(matchClients(name, [{ name: target }]).candidates).toEqual([]);
  });
  it('retains every homonym and rejects empty product names', () => {
    const clients = [
      { name: 'João Pedro Silva', room: 'A' },
      { name: 'João Paulo Silva', room: 'B' }
    ];
    expect(matchClients('João P. Silva', clients).candidates).toEqual(clients);
    expect(matchProduct({ name: '' }, [{ name: '' }]).candidates).toEqual([]);
  });
});
