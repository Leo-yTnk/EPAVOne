import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyUpload } from '../src/products/writer/components/WeeklyUpload.jsx';
const template = { filename: 'semana.xlsx', period: { label: 'Semana atual' }, products: [{}] };
it('keeps a validated attachment compact and opens the real replacement control on demand', () => {
  const onUpload = vi.fn();
  render(<WeeklyUpload template={template} onUpload={onUpload} onRemove={vi.fn()} />);
  const toggle = screen.getByRole('button', { name: 'Trocar Excel', exact: true });
  const region = document.getElementById(toggle.getAttribute('aria-controls'));
  expect(region.hidden).toBe(true);
  fireEvent.click(toggle);
  expect(region.hidden).toBe(false);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  const file = new File(['fixture'], 'nova-semana.xlsx');
  fireEvent.input(screen.getByLabelText('Trocar formulário (reinicia o pedido)'), { target: { files: [file] } });
  expect(onUpload).toHaveBeenCalledWith(file);
});
describe('Replacement failure', () => {
  it('keeps the replacement region open and the preserved attachment visible when validation fails', () => {
    const view = render(<WeeklyUpload template={template} onUpload={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trocar Excel', exact: true }));
    view.rerender(
      <WeeklyUpload template={template} error="Arquivo inválido. O pedido anterior foi preservado." onUpload={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/semana.xlsx · Semana atual/)).toBeTruthy();
    expect(screen.getByText(/Arquivo inválido/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Manter Excel atual' }).getAttribute('aria-expanded')).toBe('true');
  });
});
