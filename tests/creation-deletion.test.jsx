import { render, screen, fireEvent } from '@testing-library/preact';
import { beforeEach, expect, it, vi } from 'vitest';
import { DeleteDialog } from '../src/products/insights/creation/components/DeleteDialog.jsx';
import { deletionContext, deleteResolution } from '../src/products/insights/creation/services/deletionService.js';
vi.mock('../src/products/insights/creation/services/deletionService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  deletionContext: vi.fn()
}));
beforeEach(() => vi.clearAllMocks());
it('keeps deletion blocked until every visible reference is resolved', async () => {
  deletionContext.mockResolvedValue({
    impact: {},
    groups: { ingredients: [{ id: 'ing', recipe: { name: 'Receita' } }] },
    vocabulary: { products: [], categories: [] }
  });
  render(<DeleteDialog type="products" item={{ id: 'one', name: 'Produto' }} onClose={vi.fn()} onSaved={vi.fn()} />);
  const input = await screen.findByRole('button', { name: /Receita — ingrediente/ });
  expect(screen.getByRole('button', { name: 'Confirmar exclusão' }).disabled).toBe(true);
  fireEvent.click(input);
  fireEvent.click(await screen.findByRole('option', { name: 'Remover ingrediente da receita' }));
  expect(screen.getByRole('button', { name: 'Confirmar exclusão' }).disabled).toBe(false);
});
it('serializes replacement and optional removal using the existing RPC contract', () => {
  expect(
    deleteResolution(
      'categories',
      { products: [{ id: 'p' }], sections: [{ recipe_id: 'r' }] },
      { 'products:0': 'new', 'sections:0': 'remove' }
    )
  ).toEqual({ products: [{ id: 'p', replacement_category_id: 'new' }], sections: [{ recipe_id: 'r', action: 'remove' }] });
  expect(() => deleteResolution('categories', { products: [{ id: 'p' }] }, { 'products:0': 'remove' })).toThrow('categoria substituta');
  expect(() => deleteResolution('products', { ingredients: [{ id: 'i' }] }, {})).toThrow('Resolva todas');
});
