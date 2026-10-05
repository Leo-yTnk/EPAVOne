import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductCatalogPage } from '../src/products/insights/components/ProductCatalogPage.jsx';
import { catalogService } from '../src/products/insights/services/catalogService.js';

vi.mock('../src/products/insights/services/catalogService.js', () => ({
  catalogService: {
    structure: vi.fn().mockResolvedValue({ pages: [], sections: [], recipes: [], products: [] }),
    loadCatalog: vi.fn(),
    relatedRecipes: vi.fn(),
    recipeIngredients: vi.fn()
  }
}));
const products = Array.from({ length: 25 }, (_, index) => ({
  id: String(index),
  name: index === 24 ? 'Filé de frango com ervas finas e especiarias Swift embalagem econômica 1,5 kg' : `Produto ${index}`,
  category_id: index === 24 ? 'aves' : 'bovinos',
  category: { name: index === 24 ? 'Aves' : 'Bovinos' },
  product_code: String(1000 + index),
  regular_price_cents: 2000,
  promo_price_cents: index === 24 ? 1500 : null,
  promo_min_quantity: 2
}));
beforeEach(() => {
  vi.clearAllMocks();
  catalogService.loadCatalog.mockResolvedValue({
    products,
    categories: [
      { id: 'aves', name: 'Aves' },
      { id: 'bovinos', name: 'Bovinos' }
    ]
  });
  catalogService.relatedRecipes.mockResolvedValue([]);
  catalogService.recipeIngredients.mockResolvedValue([]);
});

describe('Insights public catalog', () => {
  it('paginates, searches accents and codes, filters category and quantity prices, and resets pagination', async () => {
    render(<ProductCatalogPage />);
    await screen.findByText('25 produtos encontrados');
    expect(screen.getAllByRole('article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: products[24].name }).textContent).toBe(products[24].name);
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'file frango' } });
    expect(screen.getByText('1 produto encontrado')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Páginas do catálogo' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Categoria Todas as categorias' }));
    fireEvent.click(screen.getByRole('option', { name: 'Aves' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.click(screen.getByLabelText('Com preço por quantidade'));
    expect(screen.getByText(/a partir de 2 un/)).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: '1024' } });
    expect(screen.getByText('1 produto encontrado')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'inexistente' } });
    expect(screen.getByText('Nenhum produto encontrado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('25 produtos encontrados')).toBeTruthy();
  });

  it('loads related recipes only after opening, shows complete recipes and closes with Escape', async () => {
    catalogService.relatedRecipes.mockResolvedValue([
      { id: 'r1', name: 'Frango assado', instructions: ['Asse até cozinhar.'], extras: ['Sal'], tips: ['Sirva quente.'] }
    ]);
    catalogService.recipeIngredients.mockResolvedValue([{ id: 'i1', quantity: 1, product: { name: 'Frango', unit: 'pacote' } }]);
    render(<ProductCatalogPage />);
    const open = await screen.findByRole('button', { name: 'Ver detalhes de Produto 0' });
    expect(catalogService.relatedRecipes).not.toHaveBeenCalled();
    open.focus();
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ver receita' }));
    expect(await within(dialog).findByText(/1 pacote/)).toBeTruthy();
    expect(within(dialog).getByText('Asse até cozinhar.')).toBeTruthy();
    expect(within(dialog).getByText('Sal')).toBeTruthy();
    expect(within(dialog).getByText('Sirva quente.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: /Voltar ao produto/ }));
    expect(within(dialog).getByRole('heading', { name: 'Receitas com este produto' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('retries failed catalog and related recipe requests without blanking the product', async () => {
    catalogService.loadCatalog.mockRejectedValueOnce(new Error('Sem conexão'));
    catalogService.relatedRecipes.mockRejectedValueOnce(new Error('Falha de consulta'));
    render(<ProductCatalogPage />);
    await screen.findByText('Sem conexão');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Produto 0' }));
    await screen.findByText('Falha de consulta');
    expect(within(screen.getByRole('dialog')).getByText(/R\$\s*20,00/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText('Nenhuma receita relacionada');
    expect(catalogService.loadCatalog).toHaveBeenCalledTimes(2);
    expect(catalogService.relatedRecipes).toHaveBeenCalledTimes(2);
  });

  it('distinguishes an empty catalog from an unsuccessful search', async () => {
    catalogService.loadCatalog.mockResolvedValue({ products: [], categories: [] });
    render(<ProductCatalogPage />);
    await screen.findByText('Catálogo vazio');
    expect(screen.queryByText('Nenhum produto encontrado')).toBeNull();
  });

  it('ignores late responses from a closed dialog when another product is opened', async () => {
    let finish;
    catalogService.relatedRecipes.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<ProductCatalogPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Produto 0' }));
    await waitFor(() => expect(catalogService.relatedRecipes).toHaveBeenCalledTimes(1));
    const signal = catalogService.relatedRecipes.mock.calls[0][1].signal;
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Produto 1' }));
    await screen.findByText('Nenhuma receita relacionada');
    finish([{ id: 'old', name: 'Receita antiga' }]);
    await waitFor(() => expect(screen.queryByText('Receita antiga')).toBeNull());
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Produto 1' })).toBeTruthy();
  });
});
