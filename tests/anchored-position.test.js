import { describe, expect, it } from 'vitest';
import { anchoredPosition } from '../src/design-system/behaviors/anchoredPosition.js';

const pixels = (value) => Number.parseFloat(value);
describe('Responsive anchored layers', () => {
  it.each([320, 390, 640, 768, 1024, 1440])('keeps menus inside a %ipx viewport at either screen edge', (width) => {
    const viewport = { left: 0, top: 0, width, height: 600, layoutHeight: 600 };
    for (const left of [0, width - 80]) {
      for (const top of [50, 500]) {
        const position = anchoredPosition({ left, top, bottom: top + 44, width: 80 }, { width: 400, height: 900 }, viewport);
        const style = position.style;
        const menuWidth = pixels(style['--layer-width']);
        const menuLeft = pixels(style['--layer-left']);
        const height = pixels(style['--layer-max-height']);
        const menuTop =
          position.side === 'bottom' ? pixels(style['--layer-top']) : viewport.layoutHeight - pixels(style['--layer-bottom']) - height;
        expect(menuLeft).toBeGreaterThanOrEqual(12);
        expect(menuLeft + menuWidth).toBeLessThanOrEqual(width - 12);
        expect(menuTop).toBeGreaterThanOrEqual(12);
        expect(menuTop + height).toBeLessThanOrEqual(588);
        expect(pixels(style['--layer-origin-x'])).toBeGreaterThanOrEqual(0);
        expect(pixels(style['--layer-origin-x'])).toBeLessThanOrEqual(menuWidth);
      }
    }
  });
  it('respects the visible viewport when the keyboard shrinks and offsets it', () => {
    const viewport = { left: 20, top: 100, width: 280, height: 220, layoutHeight: 800 };
    const { side, style } = anchoredPosition({ left: 250, top: 250, bottom: 294, width: 140 }, { width: 300, height: 900 }, viewport);
    const height = pixels(style['--layer-max-height']);
    const top = side === 'bottom' ? pixels(style['--layer-top']) : viewport.layoutHeight - pixels(style['--layer-bottom']) - height;
    expect(pixels(style['--layer-left'])).toBeGreaterThanOrEqual(32);
    expect(pixels(style['--layer-left']) + pixels(style['--layer-width'])).toBeLessThanOrEqual(288);
    expect(top).toBeGreaterThanOrEqual(112);
    expect(top + height).toBeLessThanOrEqual(308);
  });
  it('does not impose a minimum height that overflows a short viewport', () => {
    const { style } = anchoredPosition(
      { left: 100, top: 30, bottom: 60, width: 80 },
      { width: 200, height: 500 },
      { left: 0, top: 0, width: 320, height: 90, layoutHeight: 90 }
    );
    expect(pixels(style['--layer-max-height'])).toBeLessThan(96);
    expect(pixels(style['--layer-max-height'])).toBeGreaterThanOrEqual(0);
  });
});
