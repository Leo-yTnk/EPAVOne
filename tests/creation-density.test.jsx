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
it.each(['products', 'recipes', 'categories'].flatMap((type) => ['personal', 'site'].map((scope) => [type, scope])))(
  'shows the complete %s list in %s scope and searches beyond the former page limit',
  async (type, scope) => {
    creationService.load.mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `Item ${i}`, active: true, status: 'private' }))
    );
    render(<EntityManager type={type} scope={scope} />);
    await screen.findByRole('heading', { name: 'Item 99', exact: true });
    expect(screen.getAllByRole('button', { name: /^Editar Item / })).toHaveLength(100);
    expect(screen.queryByRole('button', { name: /Itens por página|Próxima página/ })).toBeNull();
    expect(screen.queryByText(/Página \d+ de/)).toBeNull();
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'Item 99' } });
    expect(screen.getAllByRole('button', { name: /^Editar Item / })).toHaveLength(1);
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getAllByRole('button', { name: /^Editar Item / })).toHaveLength(100);
  }
);
it.each([false, true])('shows every publication request without pagination (admin=%s)', async (admin) => {
  collaborationService.requests.mockResolvedValue(
    Array.from({ length: 45 }, (_, i) => ({ id: String(i), source_code: `REQ${i}`, status: i % 2 ? 'approved' : 'rejected' }))
  );
  render(<RequestsPage admin={admin} />);
  await screen.findByText('REQ44');
  expect(screen.getAllByRole('button', { name: 'Ver solicitação' })).toHaveLength(45);
  expect(screen.queryByRole('button', { name: 'Próxima página' })).toBeNull();
  fireEvent.input(screen.getByLabelText('Buscar solicitações'), { target: { value: 'REQ44' } });
  expect(screen.getAllByRole('button', { name: 'Ver solicitação' })).toHaveLength(1);
  fireEvent.input(screen.getByLabelText('Buscar solicitações'), { target: { value: '' } });
  expect(screen.getAllByRole('button', { name: 'Ver solicitação' })).toHaveLength(45);
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
