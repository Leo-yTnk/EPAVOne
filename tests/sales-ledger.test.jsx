import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { newSale, saleTotals, salesMetrics, validateSale, salesTransfer } from '../src/shared/services/sales.js';
import { SaleEditor } from '../src/products/planner/sales/SaleEditor.jsx';
import { OrderLine } from '../src/products/writer/components/OrderLine.jsx';
import { OrderDetails } from '../src/products/writer/components/OrderDetails.jsx';
import { StudentDefaultDialog } from '../src/products/writer/components/StudentDefaultDialog.jsx';
import { studentDefaults } from '../src/products/writer/services/studentDefaults.js';
import { SaleRegistrationAction } from '../src/products/writer/components/SaleRegistrationAction.jsx';
import { writerSale } from '../src/products/writer/services/writerSale.js';
const complete = () => ({
  ...newSale('Maria'),
  saleDate: '2026-10-26',
  lines: [
    { name: 'Frango', code: '123', quantity: 3, unitPrice: 10, kit: true },
    { name: 'Pão', quantity: 1, unitPrice: 5, kit: false }
  ]
});
afterEach(() => {
  localStorage.clear();
  salesTransfer.clear(salesTransfer.get()?.id);
});
describe('sales metrics', () => {
  it('uses different items rather than units, and distinct clients rather than a percentage', () => {
    const order = complete();
    expect(saleTotals(order)).toEqual({ amountCents: 3500, distinct: 2, units: 4 });
    const rows = [
      { value: 35, details: { order_data: { ...order, customerKey: 'maria' } } },
      { value: 15, details: { order_data: { ...order, customerKey: 'maria', lines: [{ name: 'Carne', quantity: 10, unitPrice: 1.5 }] } } }
    ];
    expect(salesMetrics(rows)).toMatchObject({ count: 2, gross: 5000, tm: 2500, ipc: 1.5, positivity: 1, legacy: 0 });
  });
  it('does not invent product counts or clients for legacy sales', () => {
    expect(salesMetrics([{ value: 100, ipc: 50 }])).toMatchObject({
      gross: 10000,
      count: 1,
      tm: 10000,
      ipc: null,
      positivity: 0,
      legacy: 1
    });
  });
  it('requires customer, sale date, products, prices and quantities', () => {
    expect(validateSale(newSale()).length).toBeGreaterThan(0);
    expect(validateSale(complete())).toEqual([]);
    expect(validateSale({ ...complete(), lines: [{ name: 'A', quantity: 1, unitPrice: 2, kit: true }] })).toContain(
      'Kit exige pelo menos 2 unidades do produto.'
    );
  });
});
it('disables kit for one unit and clears it when reducing an existing kit', () => {
  const change = vi.fn(),
    view = render(<OrderLine product={{ price: 10 }} line={{ name: 'Frango', quantity: 1 }} kitEnabled index={0} onChange={change} />);
  expect(screen.getByRole('checkbox', { name: 'Kit' }).disabled).toBe(true);
  view.rerender(
    <OrderLine product={{ price: 10 }} line={{ name: 'Frango', quantity: 2, kit: true }} kitEnabled index={0} onChange={change} />
  );
  expect(screen.getByRole('checkbox', { name: 'Kit' }).disabled).toBe(false);
  fireEvent.input(screen.getByLabelText('Quantidade de Frango'), { target: { value: '1' } });
  expect(change).toHaveBeenCalledWith('Frango', { quantity: 1, kit: false });
});
it('saves only the selected student and room after confirmation', () => {
  const close = vi.fn();
  render(<StudentDefaultDialog value={{ student: 'Aluno', room: '8ºD' }} onClose={close} />);
  expect(studentDefaults.read()).toBeNull();
  fireEvent.click(screen.getByText('Salvar como padrão'));
  expect(studentDefaults.read()).toEqual({ student: 'Aluno', room: '8ºD' });
  expect(close).toHaveBeenCalled();
});
it('restores defaults only when the student still exists in the template', () => {
  studentDefaults.save({ student: 'Aluno', room: '8ºD' });
  const change = vi.fn();
  render(
    <OrderDetails
      template={{ clients: [], students: [{ name: 'Aluno', room: '8ºD' }], rooms: ['8ºD'] }}
      order={{ room: '', student: '', client: '' }}
      onChange={change}
    />
  );
  expect(change).toHaveBeenCalledWith({ student: 'Aluno', room: '8ºD' });
});
it('transfers a downloaded order for explicit registration without writing to the database', () => {
  const order = complete();
  render(<SaleRegistrationAction draft={order} onNew={vi.fn()} />);
  expect(salesTransfer.get()).toBeNull();
  fireEvent.click(screen.getByText('Registrar como venda no Planner'));
  expect(salesTransfer.get()).toEqual(order);
  expect(window.location.hash).toBe('#/planner/resultados/pedidos');
});
it('keeps the full exported order details in a small JSON snapshot without workbook bytes', () => {
  const order = {
    room: 'A',
    student: 'Aluno',
    client: 'Maria',
    cpfOverride: '123',
    phone: '11',
    method: 'Retirada',
    store: 'Loja',
    date: '2026-10-27',
    payment: 'Pix',
    lines: [{ name: 'Frango', quantity: 2, kit: true }]
  };
  const draft = writerSale(
    {
      filename: 'week.xlsx',
      period: { start: '2026-10-26' },
      products: [{ name: 'Frango', code: '123', price: 10, unit: 'PC' }],
      clients: [{ name: 'Maria', room: 'A', cpf: '123', address: 'Rua', email: 'mail', birth: 123 }],
      students: [{ name: 'Aluno', room: 'A', email: 'school' }],
      stores: [{ name: 'Loja', street: 'Rua' }]
    },
    order,
    'stable-id'
  );
  expect(draft).toMatchObject({
    id: 'stable-id',
    customer: { name: 'Maria', address: 'Rua' },
    student: { name: 'Aluno' },
    delivery: { store: { name: 'Loja' } },
    lines: [{ code: '123', quantity: 2, kit: true }]
  });
  expect(draft.bytes).toBeUndefined();
});
it('preserves manual product input and sends an editable dated sale on explicit confirmation', async () => {
  const save = vi.fn();
  render(<SaleEditor initial={complete()} onSave={save} onClose={vi.fn()} />);
  fireEvent.input(screen.getByLabelText('Data da venda · obrigatória'), { target: { value: '2026-10-25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar venda' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ saleDate: '2026-10-25' }));
});

it('does not allow duplicate product rows to inflate IPC', () => {
  const order = complete();
  order.lines.push({ ...order.lines[0], code: '' });
  expect(validateSale(order)).toContain('Reúna produtos repetidos em uma única linha, somando as quantidades.');
});
it('declining the default does not change preferences', () => {
  render(<StudentDefaultDialog value={{ student: 'Aluno', room: '8ºD' }} onClose={vi.fn()} />);
  fireEvent.click(screen.getByText('Só neste pedido'));
  expect(studentDefaults.read()).toBeNull();
});

it('matches a manual sale without CPF to a single known buyer and flags ambiguous homonyms', () => {
  const entry = (cpf) => ({ value: 10, details: { order_data: { ...complete(), customer: { name: 'Maria', cpf } } } });
  expect(salesMetrics([entry('12345678900'), entry('')])).toMatchObject({ positivity: 1, ambiguous: 0 });
  expect(salesMetrics([entry('12345678900'), entry('98765432100'), entry('')])).toMatchObject({ positivity: 2, ambiguous: 1 });
});
