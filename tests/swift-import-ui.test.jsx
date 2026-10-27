import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { ImportPanel } from '../src/products/insights/creation/admin/ImportPanel.jsx';
import { adminService } from '../src/products/insights/creation/services/adminService.js';
vi.mock('../src/products/insights/creation/admin/workbookService.js', async () => {
  const { swiftOfficialProducts } = await import('../src/products/insights/creation/admin/swiftOfficialProducts.js');
  const Sheets = {
    Produtos: swiftOfficialProducts,
    Categorias: [...new Set(swiftOfficialProducts.map((p) => p.categoria))].map((nome) => ({ tipo: 'proteina', nome })),
    Receitas: [],
    Seções: [],
    'Receitas por Seção': [],
    'Produtos por Seção': []
  };
  return { readCatalogFile: vi.fn(async () => ({ SheetNames: Object.keys(Sheets), Sheets })), downloadImportTemplate: vi.fn() };
});
vi.mock('../src/products/insights/creation/services/adminService.js', () => ({
  adminService: {
    context: vi.fn().mockResolvedValue({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } }),
    importCatalog: vi.fn().mockResolvedValue({ products: { added: 11 } })
  }
}));
it('prepares an additive official bundle, prevents replacement modes and requires explicit acknowledgement before writing', async () => {
  render(<ImportPanel />);
  const input = await screen.findByLabelText('Planilha do catálogo');
  expect(screen.queryByRole('button', { name: 'Preparar produtos oficiais Swift' })).toBeNull();
  fireEvent.input(input, { target: { files: [{ name: 'catalogo.xlsx' }] } });
  await screen.findByRole('button', { name: 'Confirmar importação' });
  expect(screen.getByRole('progressbar')).toBeTruthy();
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
  fireEvent.input(await screen.findByLabelText('Planilha do catálogo'), { target: { files: [{ name: 'catalogo.xlsx' }] } });
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
it('holds progress while awaiting the database and shows a timeout without reporting success', async () => {
  adminService.context.mockResolvedValue({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } });
  let rejectImport;
  adminService.importCatalog.mockImplementationOnce((_modes, _payload, _choices, onProgress) => {
    onProgress({ value: 40, label: 'Gravando catálogo em uma única transação', waiting: true });
    return new Promise((_resolve, reject) => {
      rejectImport = reject;
    });
  });
  render(<ImportPanel />);
  fireEvent.input(await screen.findByLabelText('Planilha do catálogo'), { target: { files: [{ name: 'catalogo.xlsx' }] } });
  const confirm = await screen.findByRole('button', { name: 'Confirmar importação' });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  await screen.findByText('Aguardando confirmação do banco');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40');
  expect(confirm.disabled).toBe(true);
  rejectImport(Object.assign(new Error('O banco interrompeu a operação por exceder o tempo limite.'), { code: '57014' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Nenhuma alteração dessa transação foi salva');
  expect(screen.queryByText('Catálogo atualizado')).toBeNull();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.getByRole('checkbox').checked).toBe(false);
});

it('explains lock contention and requires another confirmation without retrying automatically', async () => {
  adminService.context.mockResolvedValue({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } });
  adminService.importCatalog.mockClear();
  adminService.importCatalog.mockRejectedValueOnce(
    Object.assign(new Error('Outra operação está usando os dados. Não foi possível obter acesso para gravar.'), { code: '55P03' })
  );
  render(<ImportPanel />);
  fireEvent.input(await screen.findByLabelText('Planilha do catálogo'), { target: { files: [{ name: 'catalogo.xlsx' }] } });
  const confirm = await screen.findByRole('button', { name: 'Confirmar importação' });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('Aguarde a outra operação terminar');
  expect(error.textContent).not.toContain('Se a conexão caiu');
  expect(adminService.importCatalog).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('checkbox').checked).toBe(false);
  expect(screen.queryByRole('progressbar')).toBeNull();
});
