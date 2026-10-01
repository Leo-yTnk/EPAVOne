import { useRef } from 'preact/hooks';
import { act, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SelectionIndicator } from '../src/design-system/components/SelectionIndicator.jsx';

function Navigation({ value }) {
  const ref = useRef(null);
  return (
    <nav ref={ref}>
      <SelectionIndicator containerRef={ref} value={value} />
      <a href="#a" aria-current={value === 'a' ? 'page' : undefined}>
        A
      </a>
      <a href="#b" aria-current={value === 'b' ? 'page' : undefined}>
        B
      </a>
    </nav>
  );
}

describe('Continuous selection highlight', () => {
  it('moves the same highlight between selected objects and adapts to resize without remounting', () => {
    let secondLeft = 120;
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.tagName === 'NAV') return { left: 10, top: 20, width: 300, height: 44 };
      return { left: this.textContent === 'B' ? secondLeft : 10, top: 20, width: this.textContent === 'B' ? 100 : 80, height: 44 };
    });
    try {
      const { container, rerender, unmount } = render(<Navigation value="a" />);
      const highlight = container.querySelector('.ds-selection-indicator');
      expect(highlight.style.getPropertyValue('--selection-x')).toBe('0px');
      rerender(<Navigation value="b" />);
      expect(container.querySelector('.ds-selection-indicator')).toBe(highlight);
      expect(highlight.style.getPropertyValue('--selection-x')).toBe('110px');
      expect(highlight.style.getPropertyValue('--selection-width')).toBe('100px');
      secondLeft = 160;
      act(() => window.dispatchEvent(new Event('resize')));
      expect(highlight.style.getPropertyValue('--selection-x')).toBe('150px');
      const measured = rect.mock.calls.length;
      unmount();
      window.dispatchEvent(new Event('resize'));
      expect(rect.mock.calls.length).toBe(measured);
    } finally {
      rect.mockRestore();
    }
  });
});
