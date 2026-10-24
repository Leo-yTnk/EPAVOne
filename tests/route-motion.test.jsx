import { act, render } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import { afterEach, expect, it, vi } from 'vitest';
import { useRouteMotion } from '../src/app/useRouteMotion.js';
function Example({ product, loading = false }) {
  const ref = useRef(null);
  useRouteMotion(ref, product, product);
  return (
    <div ref={ref} key={product}>
      {loading ? <span data-route-loading>Carregando app</span> : product}
    </div>
  );
}
afterEach(() => {
  delete Element.prototype.animate;
  delete document.documentElement.dataset.reducedMotion;
});
it('waits for lazy app content instead of spending the transition on the spinner', async () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  Element.prototype.animate = animate;
  const view = render(<Example product="home" />);
  view.rerender(<Example product="planner" loading />);
  expect(animate).not.toHaveBeenCalled();
  await act(async () => view.rerender(<Example product="planner" />));
  expect(animate).toHaveBeenCalledTimes(1);
  expect(animate.mock.calls[0][0][0].opacity).toBe(0.72);
});
it('does not animate abandoned app loads or pending content after reduced motion is enabled', async () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  Element.prototype.animate = animate;
  const view = render(<Example product="home" />);
  view.rerender(<Example product="planner" loading />);
  view.rerender(<Example product="insights" loading />);
  document.documentElement.dataset.reducedMotion = 'true';
  await act(async () => view.rerender(<Example product="insights" />));
  expect(animate).not.toHaveBeenCalled();
});
it('uses spatial direction, cancels rapid transitions and settles at the natural layout', () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Element.prototype.animate = animate;
  const view = render(<Example product="home" />);
  expect(animate).not.toHaveBeenCalled();
  view.rerender(<Example product="planner" />);
  expect(animate.mock.calls[0][0][0].translate).toBe('18px 0');
  view.rerender(<Example product="home" />);
  expect(cancel).toHaveBeenCalled();
  expect(animate.mock.calls[1][0][0].translate).toBe('-18px 0');
  expect(animate.mock.calls[1][0].at(-1).translate).toBe('0px 0');
  view.unmount();
  expect(cancel).toHaveBeenCalled();
});
it('keeps navigation available without motion APIs and with the in-app preference', () => {
  document.documentElement.dataset.reducedMotion = 'true';
  const animate = vi.fn();
  Element.prototype.animate = animate;
  const view = render(<Example product="home" />);
  view.rerender(<Example product="writer" />);
  expect(animate).not.toHaveBeenCalled();
  delete Element.prototype.animate;
  view.rerender(<Example product="planner" />);
});
it('limits movement to the available viewport gutter on mobile', () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  Element.prototype.animate = animate;
  const rect = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockReturnValue({ left: 12, right: window.innerWidth - 12, width: window.innerWidth - 24 });
  const view = render(<Example product="home" />);
  view.rerender(<Example product="planner" />);
  expect(animate.mock.calls[0][0][0].translate).toBe('12px 0');
  rect.mockRestore();
});
