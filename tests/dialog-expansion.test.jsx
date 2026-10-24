import { render, screen, fireEvent } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from '../src/design-system/components/Dialog.jsx';

function Example({ expand = true }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <article data-dialog-origin>
        <button onClick={() => setOpen(true)}>Abrir</button>
      </article>
      <Dialog open={open} expandFromTrigger={expand} title="Detalhes" onClose={() => setOpen(false)}>
        Conteúdo
      </Dialog>
    </>
  );
}
afterEach(() => vi.restoreAllMocks());
describe('Dialog expansion from its initiating card', () => {
  it('limits arrival without stretching the card, cancels on close and restores trigger focus', () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return this.hasAttribute('data-dialog-origin')
        ? { left: 40, top: 80, width: 200, height: 160 }
        : { left: 20, top: 30, width: 800, height: 640 };
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
    Element.prototype.animate = animate;
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0][0].transform).toBe('translate(-6px, 12px)');
    expect(screen.getByRole('dialog').classList.contains('ds-dialog-expanding')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    delete Element.prototype.animate;
    vi.unstubAllGlobals();
  });
  it('skips expansion for reduced motion and unsupported browsers', () => {
    const animate = vi.fn();
    Element.prototype.animate = animate;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }))
    );
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(animate).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
    delete Element.prototype.animate;
    vi.unstubAllGlobals();
  });
});
it('uses the initiating touch geometry even when the browser does not focus the trigger', async () => {
  const { rememberMotionOrigin } = await import('../src/design-system/behaviors/motion.js');
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Element.prototype.animate = animate;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.hasAttribute('data-dialog-origin')
      ? { left: 40, top: 80, width: 200, height: 160 }
      : { left: 20, top: 30, width: 800, height: 640 };
  });
  render(<Example />);
  const trigger = screen.getByRole('button', { name: 'Abrir' });
  rememberMotionOrigin(trigger);
  fireEvent.click(trigger);
  expect(animate.mock.calls[0][0][0].transform).toBe('translate(-6px, 12px)');
  expect(animate.mock.calls[0][0].at(-1).transform).toBe('translate(0, 0)');
  delete Element.prototype.animate;
});
