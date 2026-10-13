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
it('compares duplicates, preserves originals by default and resets confirmation when selecting imported content', async () => {
  adminService.importCatalog.mockClear();
  const { swiftOfficialProducts } = await import('../src/products/insights/creation/admin/swiftOfficialProducts.js');
  const row = swiftOfficialProducts[0];
  adminService.context.mockResolvedValue({
    categories: [],
    products: [
      {
        id: 'existing',
        name: row.nome,
        swift_product_url: row.swift_url,
        unit: 'un',
        image_url: 'https://example.com/original.jpg',
        version: 7,
        active: true
      }
    ],
    recipes: [],
    structure: { pages: [], sections: [] }
  });
  render(<ImportPanel />);
  fireEvent.click(await screen.findByRole('button', { name: 'Preparar produtos oficiais Swift' }));
  const label = `Duplicata de ${row.nome}: manter qual conteúdo?`;
  const choice = await screen.findByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
  expect(choice.textContent).toContain('Manter original');
  fireEvent.click(screen.getByRole('button', { name: 'Comparar original e importado' }));
  expect(screen.getByText('Original')).toBeTruthy();
  expect(screen.getByText('Importado')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox'));
  const confirm = screen.getByRole('button', { name: 'Confirmar importação' });
  expect(confirm.disabled).toBe(false);
  fireEvent.click(choice);
  fireEvent.click(await screen.findByRole('option', { name: 'Usar conteúdo importado' }));
  expect(confirm.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() => expect(adminService.importCatalog).toHaveBeenCalledTimes(1));
  expect(adminService.importCatalog.mock.calls[0][2]).toEqual([{ entity: 'products', index: 0, id: 'existing', version: 7 }]);
});
