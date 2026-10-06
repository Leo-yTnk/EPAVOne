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
  it('uses card geometry, cancels on close and restores trigger focus', () => {
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
    expect(animate.mock.calls[0][0][0].transform).toBe('translate(20px, 50px) scale(0.25, 0.25)');
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
