import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityEditor } from '../src/products/insights/creation/components/EntityEditor.jsx';
import { CreationPage } from '../src/products/insights/creation/CreationPage.jsx';
import { creationService } from '../src/products/insights/creation/services/creationService.js';
vi.mock('../src/products/insights/creation/services/creationService.js', () => ({
  creationService: { vocabulary: vi.fn(), detail: vi.fn(), save: vi.fn(), load: vi.fn() }
}));
beforeEach(() => {
  vi.clearAllMocks();
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
    await screen.findByText('Sem conexão');
    expect(screen.getByLabelText('Nome').value).toBe('Minha categoria');
    fireEvent.keyDown(document, { key: 'Escape' });
    await screen.findByText('Descartar alterações?');
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar e fechar' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
});
