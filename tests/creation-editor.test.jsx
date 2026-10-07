import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityEditor } from '../src/products/insights/creation/components/EntityEditor.jsx';
import { EntityManager } from '../src/products/insights/creation/components/EntityManager.jsx';
import { CreationPage } from '../src/products/insights/creation/CreationPage.jsx';
import { creationService } from '../src/products/insights/creation/services/creationService.js';
vi.mock('../src/products/insights/creation/services/creationService.js', () => ({
  creationService: { vocabulary: vi.fn(), detail: vi.fn(), save: vi.fn(), load: vi.fn() }
}));
beforeEach(() => {
  vi.clearAllMocks();
  creationService.detail.mockResolvedValue({});
  creationService.vocabulary.mockResolvedValue({ categories: [], products: [] });
});
describe('Creation editor', () => {
  it('requires login and does not load private data for a visitor', () => {
    const open = vi.fn();
    render(<CreationPage route={{ segments: ['criacao'] }} account={{ session: null }} onOpenAccount={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar para criar' }));
    expect(open).toHaveBeenCalled();
    expect(creationService.load).not.toHaveBeenCalled();
  });
  it('retains fields on save failure and asks before discarding with Escape', async () => {
    creationService.save.mockRejectedValue(new Error('Sem conexão'));
    const close = vi.fn();
    render(<EntityEditor type="categories" scope="personal" onClose={close} onSaved={vi.fn()} />);
    fireEvent.input(await screen.findByLabelText('Nome'), { target: { value: 'Minha categoria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await screen.findByText(/Sem conexão/);
    expect(screen.getByLabelText('Nome').value).toBe('Minha categoria');
    fireEvent.keyDown(document, { key: 'Escape' });
    await screen.findByText('Descartar alterações?');
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar e fechar' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
  it('filters library status together with search and offers a useful empty state', async () => {
    creationService.load.mockResolvedValue([
      { id: 'a', name: 'Frango da casa', status: 'private' },
      { id: 'b', name: 'Frango publicado', status: 'published' }
    ]);
    render(<EntityManager type="recipes" />);
    await screen.findByText('Frango da casa');
    fireEvent.click(screen.getByRole('button', { name: 'Publicada' }));
    expect(screen.queryByText('Frango da casa')).toBeNull();
    expect(screen.getByText('Frango publicado')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar receitas'), { target: { value: 'Outra' } });
    expect(screen.getByText('Nenhum resultado para estes filtros')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('Frango da casa')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Frango da casa' }));
    await waitFor(() => expect(creationService.detail).toHaveBeenCalledWith('recipes', expect.objectContaining({ id: 'a' })));
    await screen.findByLabelText('Nome');
  });
  it('saves using the refreshed product version and values rather than the stale list row', async () => {
    creationService.detail.mockResolvedValue({
      item: { id: 'p', name: 'Produto atualizado', category_id: 'c', price: 20, version: 7 },
      sections: []
    });
    creationService.save.mockResolvedValue({});
    render(
      <EntityEditor type="products" scope="personal" item={{ id: 'p', name: 'Antigo', version: 2 }} onClose={vi.fn()} onSaved={vi.fn()} />
    );
    expect((await screen.findByLabelText('Nome')).value).toBe('Produto atualizado');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(creationService.save).toHaveBeenCalledWith(
        'products',
        'personal',
        expect.objectContaining({ version: 7 }),
        expect.objectContaining({ name: 'Produto atualizado' })
      )
    );
  });
});
