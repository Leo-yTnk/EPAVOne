import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import fixture from './fixtures/week44-products.json';
import { matchProduct } from '../src/shared/services/productMatching.js';
import { recipeLines, recipeRows, mergeOrderLines } from '../src/shared/services/recipeOrder.js';
import { RecipeOrderHandoff } from '../src/products/writer/components/RecipeOrderHandoff.jsx';
import { RecipeDetails } from '../src/products/insights/components/RecipeDetails.jsx';
import { catalogService } from '../src/products/insights/services/catalogService.js';
import { TemplateFeedback } from '../src/products/writer/components/TemplateFeedback.jsx';
import { weeklyOrder } from '../src/shared/services/weeklyOrder.js';
vi.mock('../src/products/insights/services/catalogService.js', () => ({ catalogService: { recipeIngredients: vi.fn() } }));
afterEach(() => {
  weeklyOrder.dismiss(weeklyOrder.get().request?.id);
});
const source = fixture.insights.find((p) => p.name.includes('Bacalhau'));
const missing = { name: 'Ingrediente ausente', product_code: 'YPR-9999', unit: 'pacote', quantity: 1 };
const request = {
  id: 'recipe',
  kind: 'recipe',
  name: 'Receita de teste',
  items: [{ ...source, quantity: 2 }, missing],
  extras: ['Sal a gosto']
};
describe('real week 44 catalog regression', () => {
  it('recognizes internal YPR identifiers separately from the actual Swift code', () => {
    for (const product of fixture.insights.filter((p) => !p.name.includes('1,02kg'))) {
      const result = matchProduct(product, fixture.products);
      expect(result.candidates, product.name).toHaveLength(1);
      expect(result.reason).toBe('name');
    }
    expect(matchProduct(source, fixture.products).candidates[0].code).toBe('615551');
  });
  it('still blocks an incompatible pack size and conflicting real codes', () => {
    expect(
      matchProduct(
        fixture.insights.find((p) => p.name.includes('1,02kg')),
        fixture.products
      ).candidates
    ).toEqual([]);
    expect(matchProduct({ ...source, product_code: '999999' }, fixture.products).candidates).toEqual([]);
  });
});
it('merges recipe products with the existing cart atomically and rejects overflow', () => {
  const rows = recipeRows(request, fixture.products);
  expect(() => recipeLines(rows, {})).toThrow('Confira o produto');
  const lines = recipeLines(rows, { 1: { skip: true } });
  expect(lines).toEqual([{ name: source.name, quantity: 2, kit: false }]);
  const before = [{ name: source.name, quantity: 1, kit: true }];
  expect(mergeOrderLines(before, lines)).toEqual([{ name: source.name, quantity: 3, kit: true }]);
  expect(before[0].quantity).toBe(1);
  expect(() => mergeOrderLines([{ ...before[0], quantity: 9999 }], lines)).toThrow('ultrapassa');
});
it('requires the missing ingredient to be handled explicitly before bulk addition', () => {
  const add = vi.fn();
  render(<RecipeOrderHandoff request={request} template={{ products: fixture.products }} onAdd={add} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByText('Revisar receita'));
  expect(screen.getByRole('button', { name: 'Adicionar produtos conferidos' }).disabled).toBe(true);
  expect(screen.getByText('Sal a gosto')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox', { name: /Não incluir Ingrediente ausente/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar produtos conferidos' }));
  expect(add).toHaveBeenCalledWith([{ name: source.name, quantity: 2, kit: false }]);
});
it('keeps recipe selection and failure visible when the cart rejects addition', () => {
  const add = vi.fn(() => {
    throw new Error('Limite do carrinho');
  });
  render(
    <RecipeOrderHandoff request={{ ...request, items: request.items.slice(0, 1) }} template={{ products: fixture.products }} onAdd={add} />
  );
  fireEvent.click(screen.getByText('Revisar receita'));
  fireEvent.click(screen.getByText('Adicionar produtos conferidos'));
  expect(screen.getByText('Limite do carrinho')).toBeTruthy();
  expect(screen.getByRole('dialog')).toBeTruthy();
});
it('sends every recipe product and keeps extras for the Writer review', async () => {
  const ingredients = [
    { id: 'a', quantity: 2, product: source },
    { id: 'b', quantity: 1, product: missing }
  ];
  catalogService.recipeIngredients.mockResolvedValue(ingredients);
  render(<RecipeDetails recipe={{ id: 'r', name: 'Receita', extras: ['Sal'] }} />);
  fireEvent.click(await screen.findByText('Criar pedido com a receita inteira'));
  expect(window.location.hash).toBe('#/writer');
  expect(weeklyOrder.get().request).toMatchObject({ kind: 'recipe', name: 'Receita', extras: ['Sal'] });
  expect(weeklyOrder.get().request.items).toHaveLength(2);
});
it('keeps technical model warnings in one closed disclosure instead of stacked alerts', () => {
  render(<TemplateFeedback template={{ warnings: ['Aviso A', 'Aviso B'] }} />);
  const detail = screen.getByText('Detalhes do formulário (2)').closest('details');
  expect(detail.open).toBe(false);
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
});
it('blocks expired recipe requests', async () => {
  render(
    <RecipeOrderHandoff
      expired
      request={{ ...request, items: request.items.slice(0, 1) }}
      template={{ products: fixture.products }}
      onAdd={vi.fn()}
    />
  );
  fireEvent.click(screen.getByText('Revisar receita'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Adicionar produtos conferidos' }).disabled).toBe(true));
});

it('converts measured ingredients to whole packs and requires an explicit quantity for unknown units', () => {
  const rows = recipeRows({ items: [{ name: 'Bacalhau Desfiado Dessalgado Swift 500g', quantity: 1.2, unit: 'kg' }] }, fixture.products);
  expect(rows[0].suggestedQuantity).toBe(3);
  const unknown = recipeRows({ items: [{ name: source.name, quantity: 2, unit: 'xícaras' }] }, fixture.products);
  expect(unknown[0].suggestedQuantity).toBe('');
  expect(() => recipeLines(unknown, {})).toThrow('quantidade');
});
