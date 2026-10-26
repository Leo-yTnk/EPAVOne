import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Input, Textarea, Select } from '../src/design-system/components/index.js';

const description = (node) =>
  node
    .getAttribute('aria-describedby')
    .split(' ')
    .map((id) => document.getElementById(id).textContent)
    .join(' ');
describe('Shared field descriptions', () => {
  it('keeps help out of the input name and preserves an external description', () => {
    render(
      <>
        <p id="external">Somente números.</p>
        <Input label="Telefone" helper="Inclua o DDD." aria-describedby="external" />
      </>
    );
    const field = screen.getByRole('textbox', { name: 'Telefone' });
    expect(description(field)).toBe('Somente números. Inclua o DDD.');
    expect(field.getAttribute('aria-invalid')).toBeNull();
  });
  it('replaces help with the current error and removes invalid state after correction', () => {
    const view = render(<Textarea label="Preparo" helper="Uma etapa por linha." error="Informe ao menos uma etapa." />);
    const field = screen.getByRole('textbox', { name: 'Preparo' });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(description(field)).toBe('Informe ao menos uma etapa.');
    view.rerender(<Textarea label="Preparo" helper="Uma etapa por linha." />);
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(description(field)).toBe('Uma etapa por linha.');
  });
  it('gives repeated forms unique message references and describes Select help', () => {
    render(
      <>
        <Input label="Nome" helper="Biblioteca pessoal." />
        <Input label="Nome" helper="Catálogo público." />
        <Select label="Categoria" options={[{ value: 'a', label: 'Aves' }]} value="a" helper="Escolha uma categoria." />
      </>
    );
    const fields = screen.getAllByRole('textbox', { name: 'Nome' });
    expect(fields[0].id).not.toBe(fields[1].id);
    expect(description(fields[0])).toBe('Biblioteca pessoal.');
    expect(description(fields[1])).toBe('Catálogo público.');
    expect(description(screen.getByRole('button', { name: /Categoria/ }))).toBe('Escolha uma categoria.');
  });
});
