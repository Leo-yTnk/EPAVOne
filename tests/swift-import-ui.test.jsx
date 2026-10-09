import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { ImportPanel } from '../src/products/insights/creation/admin/ImportPanel.jsx';
import { adminService } from '../src/products/insights/creation/services/adminService.js';
vi.mock('../src/products/insights/creation/services/adminService.js', () => ({
  adminService: {
    context: vi.fn().mockResolvedValue({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } }),
    importCatalog: vi.fn().mockResolvedValue({ products: { added: 11 } })
  }
}));
it('prepares an additive official bundle, prevents replacement modes and requires explicit acknowledgement before writing', async () => {
  render(<ImportPanel />);
  const prepare = await screen.findByRole('button', { name: 'Preparar produtos oficiais Swift' });
  fireEvent.click(prepare);
  expect(await screen.findByText('Prévia pronta para revisão')).toBeTruthy();
  expect(screen.queryByText('Catálogo atualizado')).toBeNull();
  const confirm = screen.getByRole('button', { name: 'Confirmar importação' });
  expect(confirm.disabled).toBe(true);
  expect(adminService.importCatalog).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Adicionar e atualizar' })).toBeNull();
  expect(screen.getAllByRole('tab')).toHaveLength(6);
  fireEvent.click(screen.getByRole('tab', { name: 'Categorias (4)' }));
  expect(screen.getByText('Sobremesas')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() => expect(adminService.importCatalog).toHaveBeenCalledTimes(1));
  const [modes, payload] = adminService.importCatalog.mock.calls[0];
  expect(Object.values(modes)).toEqual(['add', 'add', 'add', 'add', 'add', 'add']);
  expect(payload.products).toHaveLength(11);
  await screen.findByText('Catálogo atualizado');
});
