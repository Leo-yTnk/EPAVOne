import { fireEvent, render, screen, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsRoutes } from '../src/products/insights/InsightsRoutes.jsx';
import { AppShell } from '../src/app/AppShell.jsx';
import { catalogService } from '../src/products/insights/services/catalogService.js';
import { filterRecipes, recipeSuggestions } from '../src/products/insights/models/recipes.js';

vi.mock('../src/products/insights/services/catalogService.js', () => ({
  catalogService: {
    recipes: vi.fn(),
    loadHome: vi.fn(),
    loadCatalog: vi.fn(),
    recipeIngredients: vi.fn(),
    relatedRecipes: vi.fn()
  }
}));
const recipes = Array.from({ length: 25 }, (_, index) => ({
  id: String(index),
  name: index === 24 ? 'Filé de frango assado' : `Receita ${index}`,
  prep_time: index === 24 ? 20 : 50,
  category_id: index === 24 ? 'aves' : 'especial',
  category: { id: index === 24 ? 'aves' : 'especial', name: index === 24 ? 'Aves' : 'Ocasiões especiais' },
  instructions: ['Prepare os ingredientes.', 'Asse até cozinhar.'],
  extras: ['Sal'],
  featured: index === 0
}));
const products = [{ id: 'p1', name: 'Frango Swift', category_id: 'aves', category: { name: 'Aves' }, price: 20 }];
const categories = [{ id: 'aves', name: 'Aves' }];
beforeEach(() => {
  vi.clearAllMocks();
  catalogService.recipes.mockResolvedValue(recipes);
  catalogService.loadCatalog.mockResolvedValue({ products, categories });
  catalogService.loadHome.mockResolvedValue({ products, categories, recipes });
  catalogService.recipeIngredients.mockResolvedValue([{ id: 'i1', quantity: 1, product: { name: 'Frango Swift', unit: 'pacote' } }]);
  catalogService.relatedRecipes.mockResolvedValue([]);
});
const route = (segments = []) => ({ product: 'insights', segments });

describe('Insights pages and contextual navigation', () => {
  it('shows the Insights island only in that product and highlights deep product routes', () => {
    const { rerender } = render(
      <AppShell route={route(['produtos', 'categoria', 'aves'])} theme="light" onToggleTheme={vi.fn()}>
        Conteúdo
      </AppShell>
    );
    const nav = screen.getByRole('navigation', { name: 'Navegação do Insights' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((item) => item.textContent)
    ).toEqual(['Home', 'Receitas', 'Produtos']);
    expect(within(nav).getByRole('link', { name: 'Produtos' }).getAttribute('aria-current')).toBe('page');
    rerender(
      <AppShell route={route(['receitas'])} theme="light" onToggleTheme={vi.fn()}>
        Conteúdo
      </AppShell>
    );
    expect(within(nav).getByRole('link', { name: 'Receitas' }).getAttribute('aria-current')).toBe('page');
    rerender(
      <AppShell route={{ product: 'writer', segments: [] }} theme="light" onToggleTheme={vi.fn()}>
        Conteúdo
      </AppShell>
    );
    expect(screen.queryByRole('navigation', { name: 'Navegação do Insights' })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Produtos EPAV' })).toBeTruthy();
  });

  it('makes Home an editorial starting point with real counts and working category and recipe actions', async () => {
    render(<InsightsRoutes route={route()} />);
    await screen.findByRole('heading', { name: 'Uma boa venda começa com uma boa ideia.' });
    expect(screen.queryByLabelText('Buscar produto')).toBeNull();
    expect(screen.queryByLabelText('Buscar receita')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Comece pela ocasião.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Aves' }).getAttribute('href')).toBe('#/insights/produtos/categoria/aves');
    expect(screen.getByRole('link', { name: 'Encontrar uma receita' }).getAttribute('href')).toBe('#/insights/receitas');
    const open = screen.getByRole('button', { name: 'Conhecer a receita' });
    open.focus();
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByText(/1 pacote/)).toBeTruthy();
    expect(within(dialog).getByText('Sal')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: /Voltar ao produto/ })).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('loads the independent recipe catalog, paginates and combines accent, category and time filters', async () => {
    render(<InsightsRoutes route={route(['receitas'])} />);
    await screen.findByText('25 receitas encontradas');
    expect(screen.getAllByRole('article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.input(screen.getByLabelText('Buscar receita'), { target: { value: 'file frango' } });
    expect(screen.getByText('1 receita encontrada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Categoria de receita Todas as categorias' }));
    fireEvent.click(screen.getByRole('option', { name: 'Aves' }));
    fireEvent.click(screen.getByLabelText('Até 30 minutos'));
    expect(screen.getByText('1 receita encontrada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver receita de Filé de frango assado' }));
    expect(await within(screen.getByRole('dialog')).findByText('Asse até cozinhar.')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.input(screen.getByLabelText('Buscar receita'), { target: { value: 'inexistente' } });
    expect(screen.getByText('Nenhuma receita encontrada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(24);
  });

  it('opens product categories selected from Home and keeps products separate from Home', async () => {
    render(<InsightsRoutes route={route(['produtos', 'categoria', 'aves'])} />);
    await screen.findByRole('heading', { name: 'Produtos para sua próxima venda' });
    await screen.findByText('1 produto encontrado');
    expect(screen.getByRole('button', { name: 'Categoria Aves' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Uma boa venda começa com uma boa ideia.' })).toBeNull();
    expect(catalogService.loadHome).not.toHaveBeenCalled();
  });

  it('recovers failed recipe reads and distinguishes unpublished catalogs from empty searches', async () => {
    catalogService.recipes.mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce([]);
    render(<InsightsRoutes route={route(['receitas'])} />);
    await screen.findByText('Sem conexão');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText('Ainda não há receitas publicadas');
    expect(screen.queryByText('Nenhuma receita encontrada')).toBeNull();
  });

  it('keeps Home usable with empty catalogs, and allows retry when loading fails', async () => {
    catalogService.loadHome
      .mockRejectedValueOnce(new Error('Falha de consulta'))
      .mockResolvedValueOnce({ products: [], categories: [], recipes: [] });
    render(<InsightsRoutes route={route()} />);
    await screen.findByText('Falha de consulta');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText('Novas ideias em breve');
    expect(screen.getByRole('link', { name: 'Consultar produtos' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Preços por quantidade' })).toBeNull();
  });

  it('suggests featured recipes first without mutating the catalog and excludes unknown durations from quick filters', () => {
    const source = [
      { id: 'a', name: 'Ágil', prep_time: 10 },
      { id: 'b', name: 'Destaque', prep_time: 60, featured: true },
      { id: 'c', name: 'Sem tempo', prep_time: null }
    ];
    expect(recipeSuggestions(source, 2).map((recipe) => recipe.id)).toEqual(['b', 'a']);
    expect(source.map((recipe) => recipe.id)).toEqual(['a', 'b', 'c']);
    expect(filterRecipes(source, { quick: true }).map((recipe) => recipe.id)).toEqual(['a']);
  });
});
