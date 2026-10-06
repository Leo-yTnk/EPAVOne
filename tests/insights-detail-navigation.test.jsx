import { fireEvent, render, screen, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeDialog } from '../src/products/insights/components/RecipeDialog.jsx';
import { catalogService } from '../src/products/insights/services/catalogService.js';

vi.mock('../src/products/insights/services/catalogService.js', () => ({
  catalogService: { recipeIngredients: vi.fn(), relatedRecipes: vi.fn() }
}));
const recipe = { id: 'r1', name: 'Frango assado', instructions: ['Asse até cozinhar.'], image_url: 'https://example.com/receita.jpg' };
const product = {
  id: 'p1',
  name: 'Frango Swift',
  unit: 'pacote',
  regular_price_cents: 2000,
  image_url: 'https://example.com/frango.jpg',
  swift_product_url: 'https://www.swift.com.br/frango'
};
beforeEach(() => {
  vi.clearAllMocks();
  catalogService.recipeIngredients.mockResolvedValue([{ id: 'i1', quantity: 1, product }]);
  catalogService.relatedRecipes.mockResolvedValue([recipe]);
});
describe('Connected Insights details', () => {
  it('opens ingredient products in the same dialog and returns to the complete recipe', async () => {
    render(<RecipeDialog recipe={recipe} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector(':scope > .ds-stitch')).toBeTruthy();
    expect(dialog.querySelector('.insights-recipe-panel > .ds-stitch')).toBeNull();
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ver produto Frango Swift' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(within(dialog).getByRole('heading', { name: 'Frango Swift' })).toBeTruthy();
    expect(within(dialog).getByText(/R\$\s*20,00/)).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: 'Consultar na Swift ↗' }).getAttribute('href')).toBe(product.swift_product_url);
    fireEvent.click(within(dialog).getByRole('button', { name: '← Voltar à receita' }));
    expect(await within(dialog).findByText('Asse até cozinhar.')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: /Voltar/ })).toBeNull();
    expect(document.activeElement.classList.contains('insights-detail-content')).toBe(true);
  });
  it('supports recipe → product → related recipe and back through both views', async () => {
    const onClose = vi.fn();
    render(<RecipeDialog recipe={recipe} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ver produto Frango Swift' }));
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ver receita' }));
    expect(await within(dialog).findByText('Asse até cozinhar.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: '← Voltar ao produto' }));
    expect(within(dialog).getByRole('heading', { name: 'Frango Swift' })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: '← Voltar à receita' }));
    expect(await within(dialog).findByText('1 pacote')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
