import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { FileInput } from '../src/design-system/components/FileInput.jsx';
describe('FileInput', () => {
  it('opens the native picker through its button and allows the same file to be selected again', () => {
    const onFile = vi.fn();
    render(<FileInput label="Pedido da semana" accept=".xlsx" onFile={onFile} />);
    const native = screen.getByLabelText('Pedido da semana');
    const click = vi.spyOn(native, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Escolher arquivo Excel' }));
    expect(click).toHaveBeenCalledOnce();
    const file = new File(['x'], 'pedido.xlsx');
    fireEvent.input(native, { target: { files: [file] } });
    fireEvent.input(native, { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledTimes(2);
    expect(native.value).toBe('');
  });
  it('shows the accepted filename and blocks the picker while loading', () => {
    render(<FileInput label="Pedido" filename="pedido.xlsx" loading onFile={vi.fn()} />);
    expect(screen.getByLabelText('Pedido').disabled).toBe(true);
    expect(screen.getByRole('button', { name: /Trocar arquivo/ }).disabled).toBe(true);
    expect(screen.getByRole('status', { name: 'pedido.xlsx' }).textContent).toContain('Verificando');
  });
});
