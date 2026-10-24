import { act, render } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import { afterEach, expect, it, vi } from 'vitest';
import { useContentMotion } from '../src/design-system/behaviors/useContentMotion.js';

function Example({ current, depth }) {
  const ref = useRef(null);
  useContentMotion(ref, current, depth);
  return (
    <div ref={ref}>
      <button>{current}</button>
    </div>
  );
}
afterEach(() => {
  delete Element.prototype.animate;
  delete document.documentElement.dataset.reducedMotion;
  vi.unstubAllGlobals();
});
it('shows new controls immediately, reverses on back and cancels interrupted transitions', () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Element.prototype.animate = animate;
  const view = render(<Example current="recipe" depth={1} />);
  expect(animate).not.toHaveBeenCalled();
  view.rerender(<Example current="product" depth={2} />);
  expect(view.getByRole('button').textContent).toBe('product');
  expect(animate.mock.calls[0][0][0].transform).toBe('translateX(6px)');
  view.rerender(<Example current="recipe" depth={1} />);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(animate.mock.calls[1][0][0].transform).toBe('translateX(-6px)');
  expect(animate.mock.calls[1][0].at(-1)).toEqual({ opacity: 1, transform: 'translateX(0)' });
  view.unmount();
  expect(cancel).toHaveBeenCalledTimes(2);
});
it('cancels when the local motion preference changes and skips subsequent animation', async () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Element.prototype.animate = animate;
  const view = render(<Example current="recipe" depth={1} />);
  view.rerender(<Example current="product" depth={2} />);
  await act(async () => {
    document.documentElement.dataset.reducedMotion = 'true';
  });
  expect(cancel).toHaveBeenCalled();
  view.rerender(<Example current="recipe" depth={1} />);
  expect(animate).toHaveBeenCalledTimes(1);
});
it('responds to system preference changes and cleans up the listener', () => {
  const cancel = vi.fn();
  const removeEventListener = vi.fn();
  let change;
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (_type, fn) => {
      change = fn;
    },
    removeEventListener
  }));
  Element.prototype.animate = vi.fn(() => ({ cancel }));
  const view = render(<Example current="recipe" depth={1} />);
  view.rerender(<Example current="product" depth={2} />);
  change();
  expect(cancel).toHaveBeenCalled();
  view.unmount();
  expect(removeEventListener).toHaveBeenCalledWith('change', change);
});
it('works without animation APIs and respects system reduced motion on entry', () => {
  const view = render(<Example current="recipe" depth={1} />);
  view.rerender(<Example current="product" depth={2} />);
  const animate = vi.fn();
  Element.prototype.animate = animate;
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  view.rerender(<Example current="recipe" depth={1} />);
  expect(animate).not.toHaveBeenCalled();
  expect(view.getByRole('button').textContent).toBe('recipe');
});
