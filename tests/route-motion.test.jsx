import { render } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import { afterEach, expect, it, vi } from 'vitest';
import { useRouteMotion } from '../src/app/useRouteMotion.js';
function Example({ product }) {
  const ref = useRef(null);
  useRouteMotion(ref, product, product);
  return (
    <div ref={ref} key={product}>
      {product}
    </div>
  );
}
afterEach(() => {
  delete Element.prototype.animate;
  delete document.documentElement.dataset.reducedMotion;
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
