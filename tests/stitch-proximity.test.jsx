import { render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { Card } from '../src/design-system/components/Card.jsx';
it('keeps all cards present while measuring only nearby decorations and releasing both observers', () => {
  let intersections;
  let sizes;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnectSize = vi.fn();
  const disconnectProximity = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback, options) {
        intersections = callback;
        expect(options.rootMargin).toBe('600px 0px');
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnectProximity;
    }
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        sizes = callback;
      }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnectSize;
    }
  );
  try {
    const { container, unmount } = render(
      <div>
        <Card>A</Card>
        <Card>B</Card>
      </div>
    );
    const [a, b] = container.querySelectorAll('.ds-stitch');
    expect(container.querySelectorAll('article')).toHaveLength(2);
    expect(observe).not.toHaveBeenCalled();
    intersections([
      { target: a, isIntersecting: true },
      { target: b, isIntersecting: false }
    ]);
    expect(observe).toHaveBeenCalledExactlyOnceWith(a);
    sizes([{ target: a, contentRect: { width: 300, height: 200 } }]);
    expect(a.dataset.stitchReady).toBe('true');
    expect(b.dataset.stitchReady).toBe('false');
    intersections([
      { target: a, isIntersecting: false },
      { target: b, isIntersecting: true }
    ]);
    expect(unobserve).toHaveBeenCalledWith(a);
    expect(observe).toHaveBeenCalledWith(b);
    unmount();
    expect(disconnectProximity).toHaveBeenCalledOnce();
    expect(disconnectSize).toHaveBeenCalledTimes(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
