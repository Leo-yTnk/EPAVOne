import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { PlannerRoutes } from '../src/products/planner/PlannerRoutes.jsx';
import { commercialCatalog } from '../src/shared/services/commercialCatalog.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { useIntelligenceModel } from '../src/products/planner/hooks/useIntelligence.js';
import { weeklyOrder } from '../src/shared/services/weeklyOrder.js';
import { commercialContext } from '../src/shared/services/commercialContext.js';
import { RecipesPage } from '../src/products/insights/components/RecipesPage.jsx';
import { catalogService } from '../src/products/insights/services/catalogService.js';
const now = '2026-10-28',
  empty = { products: [], categories: [], recipes: [], links: [] };
const c = { id: 'p', name: 'Peito 1kg', product_code: '1', category: { name: 'Aves' } };
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  weeklyOrder.attach(null);
  commercialContext.clear();
  sessionStorage.clear();
});
function Harness({ state, week, loader }) {
  const model = useIntelligenceModel(state, week, loader);
  return (
    <>
      <span data-testid="reason">{model.byId.get(state.customers[0].id)?.reason}</span>
      <span data-testid="count">{model.matches.get(state.customers[0].id)?.products.length}</span>
      <span data-testid="availability">{model.matches.get(state.customers[0].id)?.products[0]?.availability}</span>
      <span>{model.catalog.error}</span>
      <button onClick={model.retry}>Retry</button>
    </>
  );
}
it('invalidates preferences, catalog, workbook and selected week without retaining old account results', async () => {
  let s = demoData(now);
  let data = { ...empty, products: [c] };
  const loader = vi.fn(async () => data);
  const { rerender } = render(<Harness state={s} week={s.weeks[0]} loader={loader} />);
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  weeklyOrder.attach({
    filename: 'Week.xlsx',
    period: { start: '2026-10-26', end: '2026-11-01' },
    products: [{ name: c.name, code: '1', price: 10 }]
  });
  await waitFor(() => expect(screen.getByTestId('availability').textContent).toContain('Consta no Excel'));
  weeklyOrder.attach(null);
  await waitFor(() => expect(screen.getByTestId('availability').textContent).toContain('desconhecida'));
  s = { ...s, customers: s.customers.map((x, i) => (i ? x : { ...x, preferences: [], intent: false })) };
  rerender(<Harness state={s} week={s.weeks[0]} loader={loader} />);
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
  data = empty;
  fireEvent.click(screen.getByText('Retry'));
  await waitFor(() => expect(loader.mock.calls.length).toBeGreaterThan(1));
});
it('discards stale recommendations on refresh failure and ignores late loads after unmount', async () => {
  const s = demoData(now);
  const loader = vi
    .fn()
    .mockResolvedValueOnce({ ...empty, products: [c] })
    .mockRejectedValue(new Error('offline'));
  const { unmount } = render(<Harness state={s} week={s.weeks[0]} loader={loader} />);
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  fireEvent.click(screen.getByText('Retry'));
  await screen.findByText(/Catálogo indisponível/);
  expect(screen.getByTestId('count').textContent).not.toBe('1');
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
  unmount();
});
it('shows explanations and a working followup link, and never reuses a previous account snapshot', async () => {
  vi.spyOn(commercialCatalog, 'intelligence').mockResolvedValue(empty);
  const s = demoData(now);
  s.commitments[0].due = '2020-01-01';
  const service = { load: async () => ({ state: s }) };
  const { rerender } = render(<PlannerRoutes service={service} account={{ session: { user: { id: 'A' } } }} />);
  await screen.findByLabelText('Prioridades explicadas');
  const link = screen.getAllByRole('link', { name: 'Retomar o combinado' })[0];
  expect(link.getAttribute('href')).toBe('#/planner/clientes/demo-1/combinados');
  let resolve;
  const next = {
    load: () =>
      new Promise((r) => {
        resolve = r;
      })
  };
  rerender(<PlannerRoutes service={next} account={{ session: { user: { id: 'B' } } }} />);
  expect(screen.queryByText('Bruna (exemplo)')).toBeNull();
  await waitFor(() => expect(resolve).toBeTruthy());
  resolve({ state: { ...s, customers: [], weeks: [], interactions: [], commitments: [] } });
  await screen.findByText('Conheça seu primeiro cliente');
  expect(screen.queryByText('Bruna (exemplo)')).toBeNull();
});
it('offers real products and recipes with context-preserving links and no writes', async () => {
  const s = demoData(now);
  vi.spyOn(commercialCatalog, 'intelligence').mockResolvedValue({
    ...empty,
    products: [c],
    recipes: [{ id: 'r', name: 'Frango simples', extras: [] }],
    links: [{ recipe_id: 'r', product_id: 'p' }]
  });
  render(<PlannerRoutes route={{ segments: ['clientes', 'demo-1', 'oportunidades'] }} service={{ load: async () => ({ state: s }) }} />);
  const product = await screen.findByRole('link', { name: 'Consultar produto' });
  expect(product.getAttribute('href')).toContain(encodeURIComponent(c.name));
  fireEvent.click(product);
  expect(commercialContext.get()).toMatchObject({ customerId: 'demo-1', returnTo: '#/planner/clientes/demo-1/oportunidades' });
  expect(screen.getByRole('link', { name: 'Conferir receita' }).getAttribute('href')).toBe('#/insights/receitas/receita/r');
});
it('opens a recommended public recipe in the existing Insights reading dialog', async () => {
  const recipe = { id: 'r', name: 'Frango simples', instructions: ['Prepare'], extras: [], prep_time: 20, servings: 2 };
  vi.spyOn(catalogService, 'recipes').mockResolvedValue([recipe]);
  vi.spyOn(catalogService, 'structure').mockResolvedValue({ pages: [], sections: [], recipes: [], products: [] });
  vi.spyOn(catalogService, 'recipeIngredients').mockResolvedValue([]);
  render(<RecipesPage initialRecipeId="r" />);
  await screen.findByRole('dialog');
  expect(screen.getByRole('dialog').textContent).toContain('Frango simples');
});
it('suggests a recipe complement only for the exported order linked to this customer and week', async () => {
  const s = demoData(now);
  const side = { id: 'side', name: 'Batata 500g', product_code: '2', category: { name: 'Vegetais' } };
  vi.spyOn(commercialCatalog, 'intelligence').mockResolvedValue({
    ...empty,
    products: [c, side],
    recipes: [{ id: 'r', name: 'Frango com batata', extras: [] }],
    links: [
      { recipe_id: 'r', product_id: 'p' },
      { recipe_id: 'r', product_id: 'side' }
    ]
  });
  const ctx = commercialContext.begin({
    customerId: 'demo-1',
    customerName: 'Bruna (exemplo)',
    weekId: '2026-10-26',
    returnTo: '#/planner'
  });
  commercialContext.exported(ctx.id, { saleDraft: { lines: [{ name: c.name, code: '1', quantity: 1 }] } });
  render(<PlannerRoutes route={{ segments: ['clientes', 'demo-1', 'oportunidades'] }} service={{ load: async () => ({ state: s }) }} />);
  expect((await screen.findByRole('link', { name: 'Conferir complemento' })).getAttribute('href')).toContain(encodeURIComponent(side.name));
  expect(screen.getByRole('link', { name: 'Revisar pedido no Writer' }).getAttribute('href')).toBe('#/writer');
  commercialContext.begin({ customerId: 'other', customerName: 'Outro', weekId: '2026-10-26' });
  await waitFor(() => expect(screen.queryByRole('link', { name: 'Conferir complemento' })).toBeNull());
});
