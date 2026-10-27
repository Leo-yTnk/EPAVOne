import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsRoutes } from '../src/products/insights/InsightsRoutes.jsx';
import { personalRecipesService } from '../src/products/insights/services/personalRecipesService.js';
import { catalogService } from '../src/products/insights/services/catalogService.js';

vi.mock('../src/products/insights/services/personalRecipesService.js', () => ({
  personalRecipesService: { recipes: vi.fn(), ingredients: vi.fn() }
}));
vi.mock('../src/products/insights/services/catalogService.js', () => ({
  catalogService: {
    loadHome: vi.fn(),
    recipes: vi.fn(),
    structure: vi.fn(),
    recipeIngredients: vi.fn()
  }
}));
const recipe = {
  id: 'mine',
  name: 'Minha tilápia',
  scope: 'personal',
  owner_id: 'A',
  prep_time: 20,
  instructions: ['Grelhe a tilápia.'],
  extras: ['Limão'],
  category: { id: 'fish', name: 'Peixes' }
};
const account = (id) => ({ session: id ? { user: { id } } : null });
const route = (page) => ({ product: 'insights', segments: page === 'home' ? [] : ['receitas'] });
beforeEach(() => {
  vi.clearAllMocks();
  catalogService.loadHome.mockResolvedValue({ products: [], recipes: [], categories: [] });
  catalogService.recipes.mockResolvedValue([]);
  catalogService.structure.mockResolvedValue({ pages: [], sections: [], recipes: [], products: [] });
  personalRecipesService.recipes.mockResolvedValue([recipe]);
  personalRecipesService.ingredients.mockResolvedValue([{ id: 'i', quantity: 1, product: { name: 'Meu peixe', unit: 'pacote' } }]);
});
describe('Criados por mim', () => {
  it.each(['home', 'recipes'])('shows only the authenticated section on %s and opens private ingredients', async (page) => {
    render(<InsightsRoutes route={route(page)} account={account('A')} />);
    const section = await screen.findByRole('region', { name: 'Criados por mim' });
    fireEvent.click(await within(section).findByRole('button', { name: 'Ver receita de Minha tilápia' }));
    expect(await within(screen.getByRole('dialog')).findByText('Meu peixe')).toBeTruthy();
    expect(personalRecipesService.recipes).toHaveBeenCalledWith('A', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(personalRecipesService.ingredients).toHaveBeenCalledWith(recipe, expect.anything());
    expect(catalogService.recipeIngredients).not.toHaveBeenCalled();
  });
  it('hides the section for guests without requesting private data', async () => {
    render(<InsightsRoutes route={route('home')} account={account(null)} />);
    await screen.findByText('Novas ideias em breve');
    expect(screen.queryByText('Criados por mim')).toBeNull();
    expect(personalRecipesService.recipes).not.toHaveBeenCalled();
  });
  it('clears rows and open private details on account switch and discards a late response', async () => {
    let finish;
    personalRecipesService.recipes.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const view = render(<InsightsRoutes route={route('home')} account={account('A')} />);
    await waitFor(() => expect(personalRecipesService.recipes).toHaveBeenCalled());
    personalRecipesService.recipes.mockResolvedValue([]);
    view.rerender(<InsightsRoutes route={route('home')} account={account('B')} />);
    await screen.findByText('Suas criações começam aqui');
    finish([recipe]);
    await waitFor(() => expect(screen.queryByText(recipe.name)).toBeNull());
    personalRecipesService.recipes.mockResolvedValue([recipe]);
    view.rerender(<InsightsRoutes route={route('home')} account={account('A')} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver receita de Minha tilápia' }));
    await screen.findByRole('dialog');
    view.rerender(<InsightsRoutes route={route('home')} account={account(null)} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(recipe.name)).toBeNull();
  });
  it.each(['home', 'recipes'])('keeps private recipes available after a public catalog error on %s and filters by search', async (page) => {
    catalogService.loadHome.mockRejectedValue(new Error('Catálogo público indisponível'));
    catalogService.recipes.mockRejectedValue(new Error('Catálogo público indisponível'));
    render(<InsightsRoutes route={route(page)} account={account('A')} />);
    await screen.findByText(recipe.name);
    fireEvent.input(screen.getByLabelText(page === 'home' ? 'Buscar no Insights' : 'Buscar receita'), { target: { value: 'nada' } });
    expect(await screen.findByText('Nenhuma receita pessoal encontrada')).toBeTruthy();
    expect(screen.queryByText(recipe.name)).toBeNull();
  });
  it('retries private loading independently', async () => {
    personalRecipesService.recipes.mockRejectedValueOnce(new Error('Falha privada'));
    render(<InsightsRoutes route={route('home')} account={account('A')} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(recipe.name)).toBeTruthy();
  });
});
