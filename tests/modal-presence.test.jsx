import { act, fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Dialog } from '../src/design-system/components/Dialog.jsx';
import { ModalPresence } from '../src/design-system/components/ModalPresence.jsx';
import { Select } from '../src/design-system/components/Select.jsx';

function Conditional({ onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <ModalPresence>
        {open && (
          <Dialog
            open
            title="Detalhes"
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          >
            <input aria-label="Nome" />
          </Dialog>
        )}
      </ModalPresence>
    </>
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.animate = vi.fn(() => ({ cancel: vi.fn() }));
});
afterEach(() => {
  delete Element.prototype.animate;
  delete document.documentElement.dataset.reducedMotion;
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('dismisses actions/focus immediately while retaining an inert visual exit, then removes it', () => {
  const onClose = vi.fn();
  render(<Conditional onClose={onClose} />);
  const trigger = screen.getByRole('button', { name: 'Abrir' });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.classList.contains('ds-layer-open')).toBe(false);
  const exit = document.querySelector('.ds-dialog-overlay[data-exiting="true"]');
  expect(exit.getAttribute('aria-hidden')).toBe('true');
  expect(exit.inert || exit.hasAttribute('inert')).toBeTruthy();
  act(() => vi.advanceTimersByTime(151));
  expect(document.querySelector('.ds-dialog-overlay')).toBeNull();
});
it('can reopen before exit completes with a fresh form and no stale dialog or timer', () => {
  render(<Conditional />);
  const trigger = screen.getByRole('button', { name: 'Abrir' });
  fireEvent.click(trigger);
  fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Anterior' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
  fireEvent.click(trigger);
  expect(screen.getByRole('textbox').value).toBe('');
  expect(document.querySelectorAll('.ds-dialog-overlay')).toHaveLength(1);
  act(() => vi.advanceTimersByTime(200));
  expect(screen.getByRole('dialog')).toBeTruthy();
});
it('ends an in-progress exit when the local motion preference changes', async () => {
  render(<Conditional />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
  fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
  await act(async () => {
    document.documentElement.dataset.reducedMotion = 'true';
  });
  expect(document.querySelector('.ds-dialog-overlay')).toBeNull();
});
it('retains controlled dialogs for exit as well', () => {
  const view = render(
    <Dialog open title="Controlado">
      Conteúdo
    </Dialog>
  );
  view.rerender(
    <Dialog open={false} title="Controlado">
      Conteúdo
    </Dialog>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelector('.ds-dialog-overlay[data-exiting="true"]')).toBeTruthy();
  act(() => vi.advanceTimersByTime(151));
  expect(document.querySelector('.ds-dialog-overlay')).toBeNull();
});
it('removes portaled controls immediately when their modal starts exiting', () => {
  const content = <Select label="Categoria" value="a" options={[{ value: 'a', label: 'A' }]} />;
  const view = render(
    <Dialog open title="Editar">
      {content}
    </Dialog>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Categoria A' }));
  expect(screen.getByRole('listbox')).toBeTruthy();
  view.rerender(
    <Dialog open={false} title="Editar">
      {content}
    </Dialog>
  );
  expect(screen.queryByRole('listbox')).toBeNull();
  expect(document.querySelector('.ds-dialog-overlay[data-exiting="true"]')).toBeTruthy();
});
