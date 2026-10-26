import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { SalesPage } from '../src/products/planner/sales/SalesPage.jsx';
import { saleDay, salesTransfer } from '../src/shared/services/sales.js';
afterEach(() => salesTransfer.clear(salesTransfer.get()?.id));
const order = {
  source: 'manual',
  saleDate: saleDay(),
  customer: { name: 'Maria' },
  lines: [{ name: 'Frango', quantity: 3, unitPrice: 10, kit: false }],
  shippingCents: 0
};
const row = { id: 'sale', sale_date: saleDay(), value: 30, ipc: 1, details: { revision: 1, order_data: order } };
it('shows dashboard, edits dates and totals, and confirms deletion without touching the customer workspace', async () => {
  let rows = [row];
  const repository = {
    list: vi.fn(async () => rows),
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {
      rows = [];
    }),
    find: vi.fn()
  };
  render(<SalesPage account={{ session: { user: { id: 'a' } } }} repository={repository} />);
  expect(await screen.findByText('Maria')).toBeTruthy();
  expect(screen.getByText('Itens por Cupom · IPC')).toBeTruthy();
  fireEvent.click(screen.getByText('Editar venda'));
  fireEvent.input(screen.getByLabelText('Data da venda · obrigatória'), { target: { value: '2026-10-20' } });
  fireEvent.click(screen.getByText('Confirmar e salvar venda'));
  await waitFor(() =>
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'sale', revision: 1, saleDate: '2026-10-20' }))
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByText('Excluir venda'));
  expect(repository.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Cancelar'));
  expect(repository.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Excluir venda'));
  fireEvent.click(screen.getByText('Confirmar exclusão da venda'));
  await screen.findByText('Nenhuma venda neste período');
  expect(repository.remove).toHaveBeenCalledWith(row);
});
it('reopens a Writer sale with the existing revision instead of creating a duplicate', async () => {
  salesTransfer.send({ ...order, id: 'sale', revision: 0 });
  const repository = {
    list: vi.fn().mockResolvedValue([row]),
    find: vi.fn().mockResolvedValue(row),
    save: vi.fn().mockResolvedValue({}),
    remove: vi.fn()
  };
  render(<SalesPage account={{ session: { user: { id: 'a' } } }} repository={repository} />);
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByText('Confirmar e salvar venda'));
  await waitFor(() => expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'sale', revision: 1 })));
});
it('requires authentication before listing or registering sales', () => {
  const repository = { list: vi.fn(), find: vi.fn() };
  const open = vi.fn();
  render(<SalesPage repository={repository} onOpenAccount={open} />);
  expect(repository.list).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cadastrar venda' }).disabled).toBe(true);
  fireEvent.click(screen.getByText('Entrar para registrar vendas'));
  expect(open).toHaveBeenCalled();
});
