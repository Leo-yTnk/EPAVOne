import { render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Card } from '../src/design-system/components/Card.jsx';
describe('Shared card resize work', () => {
  it('uses one observer for multiple cards, avoids identical writes and releases removed nodes', () => {
    let notify;
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    const created = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          created();
          notify = callback;
        }
        observe = vi.fn();
        unobserve = unobserve;
        disconnect = disconnect;
      }
    );
    try {
      const { container, rerender, unmount } = render(
        <div>
          <Card key="a">A</Card>
          <Card key="b">B</Card>
        </div>
      );
      const [a, b] = container.querySelectorAll('.ds-stitch');
      const operations = [];
      const originalStyle = window.getComputedStyle;
      const reads = vi.spyOn(window, 'getComputedStyle').mockImplementation((...args) => {
        operations.push('read');
        return originalStyle(...args);
      });
      const originalWrite = a.style.setProperty.bind(a.style);
      const writes = vi.spyOn(a.style, 'setProperty');
      writes.mockImplementation((...args) => {
        operations.push('write');
        return originalWrite(...args);
      });
      expect(created).toHaveBeenCalledOnce();
      const entry = { target: a, contentRect: { width: 300, height: 180 } };
      notify([entry, { target: b, contentRect: { width: 200, height: 120 } }]);
      expect(a.style.getPropertyValue('--stitch-path-width')).toBe('298px');
      expect(b.style.getPropertyValue('--stitch-path-height')).toBe('118px');
      expect(operations.slice(0, 4)).toEqual(['read', 'read', 'read', 'read']);
      expect(operations[4]).toBe('write');
      notify([entry]);
      expect(writes).toHaveBeenCalledTimes(2);
      expect(reads).toHaveBeenCalledTimes(4);
      rerender(
        <div>
          <Card key="a">A</Card>
        </div>
      );
      expect(unobserve.mock.calls.some(([node]) => node === b)).toBe(true);
      expect(disconnect).not.toHaveBeenCalled();
      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
      expect(unobserve.mock.calls.some(([node]) => node === a)).toBe(true);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });
});
