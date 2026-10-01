import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { Select } from '../src/design-system/components/Select.jsx';

describe('Select', () => {
  it('renders its listbox in a portal and selects with keyboard', () => {
    let value = 'a';
    const { rerender } = render(
      <Select
        label="Categoria"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' }
        ]}
        value={value}
        onChange={(next) => {
          value = next;
        }}
      />
    );
    const trigger = screen.getByRole('button', { name: /Categoria A/i });

    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(listbox.closest('.ds-layer-anchor').parentElement).toBe(document.body);

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(value).toBe('b');

    rerender(
      <Select
        label="Categoria"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' }
        ]}
        value={value}
      />
    );
    expect(screen.getByRole('button', { name: /Categoria B/i })).toBeTruthy();
  });
  it('searches inside the popup without changing the selected value and accepts keyboard selection', () => {
    let value = 'a';
    render(
      <Select
        label="Cliente"
        searchable
        options={[
          { value: 'a', label: 'Álvaro Silva' },
          { value: 'b', label: 'Bruna Silva' }
        ]}
        value={value}
        onChange={(next) => {
          value = next;
        }}
      />
    );
    const trigger = screen.getByRole('button', { name: /Cliente Álvaro/ });
    fireEvent.click(trigger);
    const search = screen.getByRole('combobox', { name: 'Buscar cliente' });
    fireEvent.input(search, { target: { value: 'bruna' } });
    expect(screen.queryByRole('option', { name: 'Álvaro Silva' })).toBeNull();
    expect(trigger.textContent).toContain('Álvaro Silva');
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(value).toBe('b');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
