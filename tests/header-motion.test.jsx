import { useRef } from 'preact/hooks';
import { act, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHeaderMotion } from '../src/app/useHeaderMotion.js';

function Header({ product, horizontal = true }) {
  const ref = useRef(null);
  useHeaderMotion(ref, product, horizontal);
  return (
    <div ref={ref} data-product={product}>
      <div className="workspace-navigation-scroll">
        <button role="tab" id="app" />
      </div>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.reducedMotion;
});

describe('Header width choreography', () => {
  function setup() {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel, playState: 'running' }));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return { left: 0, width: this.dataset.product === 'planner' ? 700 : 400 };
    });
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    return { animate, cancel };
  }

  afterEach(() => {
    delete HTMLElement.prototype.animate;
    vi.unstubAllGlobals();
  });

  it('interpolates the real island width, cancels superseded motion and cleans up on unmount', () => {
    const { animate, cancel } = setup();
    const { rerender, unmount } = render(<Header product="home" />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Header product="planner" />);
    expect(animate.mock.calls[0][0]).toEqual([{ width: '400px' }, { width: '700px' }]);
    rerender(<Header product="writer" />);
    expect(cancel).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('honors reduced motion and cancels immediately when the preference changes', async () => {
    const { animate, cancel } = setup();
    const { rerender } = render(<Header product="home" />);
    rerender(<Header product="planner" />);
    await act(async () => {
      document.documentElement.dataset.reducedMotion = 'true';
      await Promise.resolve();
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    rerender(<Header product="writer" />);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('cancels a running width animation before responsive layout takes over', () => {
    const { cancel } = setup();
    const { rerender } = render(<Header product="home" />);
    rerender(<Header product="planner" />);
    act(() => window.dispatchEvent(new Event('resize')));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('does not animate the sidebar or an unchanged width', () => {
    const { animate } = setup();
    const { rerender } = render(<Header product="home" />);
    rerender(<Header product="writer" />);
    rerender(<Header product="planner" horizontal={false} />);
    expect(animate).not.toHaveBeenCalled();
  });
});
