import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { Dialog } from '../src/design-system/components/Dialog.jsx';
import { Select } from '../src/design-system/components/Select.jsx';

describe('Dialog', () => {
  it('uses a portal, locks scroll and handles Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Confirmar" onClose={onClose}>
        Conteúdo
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(document.body.classList.contains('ds-layer-open')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('labels a dialog with a single heading placed inside its content', () => {
    render(
      <Dialog open title="Receita" titleInContent titleId="recipe-title">
        <h2 id="recipe-title">Receita</h2>
      </Dialog>
    );
    expect(screen.getByRole('dialog', { name: 'Receita' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Receita' })).toHaveLength(1);
  });
  it('closes a portaled select on Escape before closing the containing dialog', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Editar" onClose={onClose}>
        <Select label="Categoria" searchable value="a" options={[{ value: 'a', label: 'A' }]} />
      </Dialog>
    );
    const trigger = screen.getByRole('button', { name: 'Categoria A' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Buscar categoria' }), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
