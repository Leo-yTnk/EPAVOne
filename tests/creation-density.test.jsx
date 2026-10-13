import { render, screen, fireEvent } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { EntityManager } from '../src/products/insights/creation/components/EntityManager.jsx';
import { SharedLibrary } from '../src/products/insights/creation/components/SharedLibrary.jsx';
import { RequestsPage } from '../src/products/insights/creation/components/RequestsPage.jsx';
import { creationService } from '../src/products/insights/creation/services/creationService.js';
import { collaborationService } from '../src/products/insights/creation/services/collaborationService.js';
vi.mock('../src/products/insights/creation/services/creationService.js', () => ({ creationService: { load: vi.fn() } }));
vi.mock('../src/products/insights/creation/services/collaborationService.js', () => ({
  collaborationService: { shared: vi.fn(), requests: vi.fn() }
}));
it('changes page size without losing items or leaving the page out of range', async () => {
  creationService.load.mockResolvedValue(Array.from({ length: 50 }, (_, i) => ({ id: String(i), name: `Produto ${i}`, active: true })));
  render(<EntityManager type="products" />);
  await screen.findByText('Produto 47');
  expect(screen.queryByText('Produto 48')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Itens por página/ }));
  fireEvent.click(screen.getByRole('option', { name: '96' }));
  expect(screen.getByText('Produto 49')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Itens por página/ }));
  fireEvent.click(screen.getByRole('option', { name: '24' }));
  expect(screen.getByText('Produto 23')).toBeTruthy();
  expect(screen.queryByText('Produto 24')).toBeNull();
});
it('searches shared recipes without changing the shared library', async () => {
  collaborationService.shared.mockResolvedValue([{ recipe: { id: 'a', name: 'Frango assado' } }, { recipe: { id: 'b', name: 'Arroz' } }]);
  render(<SharedLibrary />);
  await screen.findByText('Arroz');
  fireEvent.input(screen.getByLabelText('Buscar receitas compartilhadas'), { target: { value: 'frango' } });
  expect(screen.queryByText('Arroz')).toBeNull();
  expect(screen.getByText('Frango assado')).toBeTruthy();
});
it('combines request status and search', async () => {
  collaborationService.requests.mockResolvedValue([
    { id: 'a', status: 'approved', source_code: 'REC01' },
    { id: 'b', status: 'rejected', source_code: 'REC02' }
  ]);
  render(<RequestsPage />);
  await screen.findByText('REC02');
  fireEvent.click(screen.getByRole('button', { name: /Status da solicitação/ }));
  fireEvent.click(screen.getByRole('option', { name: 'Aprovada' }));
  expect(screen.queryByText('REC02')).toBeNull();
  expect(screen.getByText('REC01')).toBeTruthy();
  fireEvent.input(screen.getByLabelText('Buscar solicitações'), { target: { value: 'REC02' } });
  expect(screen.getByText('Nenhuma solicitação encontrada')).toBeTruthy();
});
