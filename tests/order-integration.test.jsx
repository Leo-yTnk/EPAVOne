import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import { InsightsProductHandoff } from '../src/products/writer/components/InsightsProductHandoff.jsx';
import { weeklyOrder } from '../src/shared/services/weeklyOrder.js';
import { PlannerHandoff } from '../src/products/writer/components/PlannerHandoff.jsx';
afterEach(() => {
  act(() => {
    weeklyOrder.dismiss(weeklyOrder.get().request?.id);
    weeklyOrder.attach(null);
  });
});
it('requires explicit confirmation before adding a product at the workbook price', () => {
  weeklyOrder.request({ name: 'Nome no Insights', product_code: '123' });
  const add = vi.fn();
  render(<InsightsProductHandoff template={{ products: [{ code: '123', name: 'Frango 1kg', price: 14.9 }] }} onAdd={add} />);
  expect(add).not.toHaveBeenCalled();
  expect(screen.getByText(/Frango 1kg/)).toBeTruthy();
  fireEvent.click(screen.getByText('Adicionar 1 unidade ao pedido'));
  expect(add).toHaveBeenCalledExactlyOnceWith('Frango 1kg');
  expect(weeklyOrder.get().request).toBeNull();
});
it('blocks missing and expired matches', () => {
  weeklyOrder.request({ name: 'Frango', product_code: '123' });
  const add = vi.fn();
  const view = render(<InsightsProductHandoff template={{ products: [] }} onAdd={add} />);
  expect(screen.getByRole('button', { name: 'Adicionar 1 unidade ao pedido' }).disabled).toBe(true);
  view.rerender(<InsightsProductHandoff expired template={{ products: [{ code: '123', name: 'Frango', price: 12 }] }} onAdd={add} />);
  expect(screen.getByRole('button', { name: 'Adicionar 1 unidade ao pedido' }).disabled).toBe(true);
  expect(add).not.toHaveBeenCalled();
});
it('suggests a normalized unique client but still requires confirmation', () => {
  const client = { name: 'João  Silva', room: 'A' };
  const apply = vi.fn();
  render(<PlannerHandoff context={{ customerName: 'Joao Silva' }} template={{ clients: [client] }} onApply={apply} />);
  fireEvent.click(screen.getByText('Usar este cliente'));
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Confirmar cliente'));
  expect(apply).toHaveBeenCalledWith(client);
});

it('returns workbook totals to Planner only after an explicit action, without recording a sale', async () => {
  const { Attendance } = await import('../src/products/planner/components/Attendance.jsx');
  const { commercialContext } = await import('../src/shared/services/commercialContext.js');
  const { weekStart } = await import('../src/products/planner/models/planner.js');
  const week = { id: weekStart(), queue: [{ customerId: 'a', role: 'primary', outcome: null }] };
  const context = commercialContext.begin({ customerId: 'a', customerName: 'Cliente', weekId: week.id });
  commercialContext.exported(context.id, { client: 'Cliente Excel', units: 3, amountCents: 4290, filename: 'week.xlsx' });
  const save = vi.fn();
  render(
    <Attendance
      state={{
        customers: [{ id: 'a', name: 'Cliente', preferences: [], restrictions: [] }],
        interactions: [],
        commitments: [],
        offers: []
      }}
      week={week}
      act={save}
    />
  );
  expect(screen.queryByLabelText('Valor da compra (R$)')).toBeNull();
  fireEvent.click(screen.getByText('Usar valores do pedido conferido'));
  expect(screen.getByLabelText('Valor da compra (R$)').value).toBe('42.90');
  expect(screen.getByLabelText('Total de unidades').value).toBe('3');
  expect(save).not.toHaveBeenCalled();
  act(() => commercialContext.invalidate(context.id));
  expect(screen.queryByText('Usar valores do pedido conferido')).toBeNull();
  act(() => commercialContext.clear());
});

it('requires selecting even a single approximate product match', () => {
  weeklyOrder.request({ name: 'Filé de peito de frango Swift 1 kg' });
  const add = vi.fn();
  render(<InsightsProductHandoff template={{ products: [{ name: 'Frango filé de peito 1000g', price: 14.9 }] }} onAdd={add} />);
  expect(screen.getByRole('button', { name: 'Adicionar 1 unidade ao pedido' }).disabled).toBe(true);
  expect(screen.getByText(/Nome compatível após normalizar/)).toBeTruthy();
  expect(add).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Produto correspondente no Excel/ }));
  fireEvent.click(screen.getByRole('option', { name: /Frango filé de peito 1000g/ }));
  expect(screen.getByRole('button', { name: 'Adicionar 1 unidade ao pedido' }).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar 1 unidade ao pedido' }));
  expect(add).toHaveBeenCalledExactlyOnceWith('Frango filé de peito 1000g');
});
it('does not preselect a client identified only by initials', () => {
  render(
    <PlannerHandoff
      context={{ customerName: 'João P. Silva' }}
      template={{ clients: [{ name: 'João Pedro Silva', room: 'A' }] }}
      onApply={vi.fn()}
    />
  );
  fireEvent.click(screen.getByText('Usar este cliente'));
  expect(screen.getByRole('button', { name: 'Confirmar cliente' }).disabled).toBe(true);
  expect(screen.getByText(/Sugestões por sobrenomes/)).toBeTruthy();
});
