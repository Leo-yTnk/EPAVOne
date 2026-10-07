import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { Card } from '../src/design-system/components/Card.jsx';

describe('Card', () => {
  it('is stitched by default', () => {
    const { container } = render(<Card>conteúdo</Card>);
    const card = container.firstElementChild;
    expect(card.classList.contains('ds-card')).toBe(true);
    expect(card.classList.contains('ds-stitched-card')).toBe(true);
  });
  it('supports the explicit non-stitched exception', () => {
    const { container } = render(<Card stitched={false}>conteúdo</Card>);
    const card = container.firstElementChild;
    expect(card.classList.contains('ds-card')).toBe(true);
    expect(card.classList.contains('ds-stitched-card')).toBe(false);
    expect(card.querySelector('.ds-stitch')).toBeNull();
  });
  it('supports semantic elements', () => {
    const { container } = render(
      <Card as="a" href="#/insights">
        Insights
      </Card>
    );
    expect(container.firstElementChild.tagName).toBe('A');
  });
  it('resizes the stitch after asynchronous card growth and cleans up its observer', () => {
    let notify;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback) {
          notify = callback;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );
    try {
      const { container, unmount } = render(<Card>conteúdo</Card>);
      const svg = container.querySelector('.ds-stitch');
      expect(observe).toHaveBeenCalledWith(svg);
      notify([{ contentRect: { width: 300, height: 180 } }]);
      expect(svg.style.getPropertyValue('--stitch-path-height')).toBe('178px');
      notify([{ contentRect: { width: 300, height: 260 } }]);
      expect(svg.style.getPropertyValue('--stitch-path-width')).toBe('298px');
      expect(svg.style.getPropertyValue('--stitch-path-height')).toBe('258px');
      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
