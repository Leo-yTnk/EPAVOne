import { useRef } from 'preact/hooks';
import { act, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { useAnchoredLayer } from '../src/design-system/behaviors/useAnchoredLayer.js';

function Probe({ measure }) {
  const trigger = useRef({ getBoundingClientRect: measure });
  const layer = useRef({ offsetWidth: 240, scrollHeight: 500 });
  const position = useAnchoredLayer(trigger, layer, true);
  return <output>{JSON.stringify(position)}</output>;
}

describe('Anchored layer updates', () => {
  it('batches scroll/resize events, responds to the visual viewport and cancels work on unmount', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const viewport = Object.assign(new EventTarget(), { width: 320, height: 500, offsetLeft: 0, offsetTop: 0 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    let scheduled;
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      scheduled = callback;
      return 42;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const measure = vi.fn(() => ({ left: 240, top: 50, bottom: 94, width: 100 }));
    try {
      const view = render(<Probe measure={measure} />);
      expect(measure).toHaveBeenCalledTimes(1);
      act(() => {
        for (let i = 0; i < 10; i++) {
          window.dispatchEvent(new Event('scroll'));
          window.dispatchEvent(new Event('resize'));
        }
        viewport.width = 280;
        viewport.height = 180;
        viewport.dispatchEvent(new Event('resize'));
      });
      expect(request).toHaveBeenCalledTimes(1);
      expect(measure).toHaveBeenCalledTimes(1);
      act(() => scheduled());
      expect(measure).toHaveBeenCalledTimes(2);
      const position = JSON.parse(screen.getByRole('status').textContent);
      expect(Number.parseFloat(position.style['--layer-width'])).toBeLessThanOrEqual(256);
      act(() => viewport.dispatchEvent(new Event('scroll')));
      view.unmount();
      expect(cancel).toHaveBeenCalledWith(42);
      const count = request.mock.calls.length;
      viewport.dispatchEvent(new Event('resize'));
      expect(request.mock.calls.length).toBe(count);
    } finally {
      if (descriptor) Object.defineProperty(window, 'visualViewport', descriptor);
      else delete window.visualViewport;
      vi.restoreAllMocks();
    }
  });
});
