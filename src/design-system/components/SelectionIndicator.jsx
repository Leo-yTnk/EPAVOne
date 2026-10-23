import { useLayoutEffect, useState } from 'preact/hooks';
import { Card } from './Card.jsx';

export function SelectionIndicator({ containerRef, value, stitched = false }) {
  const [geometry, setGeometry] = useState(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const selected = container?.querySelector('[aria-current], [aria-selected="true"]');
    if (!container || !selected) {
      setGeometry(null);
      return;
    }
    const update = () => {
      const outer = container.getBoundingClientRect();
      const inner = selected.getBoundingClientRect();
      // Press feedback scales the visual box, not its layout. Measure the
      // unscaled target so a long press cannot leave the thumb undersized.
      const style = getComputedStyle(selected);
      const width = parseFloat(style.width) || inner.width;
      const height = parseFloat(style.height) || inner.height;
      const positionedHere = selected.offsetParent === container;
      const x = positionedHere
        ? selected.offsetLeft
        : inner.left + (inner.width - width) / 2 - outer.left + container.scrollLeft - container.clientLeft;
      const y = positionedHere
        ? selected.offsetTop
        : inner.top + (inner.height - height) / 2 - outer.top + container.scrollTop - container.clientTop;
      const next = {
        '--selection-x': x + 'px',
        '--selection-y': y + 'px',
        '--selection-width': width + 'px',
        '--selection-height': height + 'px'
      };
      setGeometry((current) => (current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next));
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(container);
    observer?.observe(selected);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, value]);
  const props = {
    className: `ds-selection-indicator${stitched ? ' is-stitched' : ''}`,
    'aria-hidden': 'true',
    'data-ready': Boolean(geometry),
    style: geometry ?? undefined
  };
  return stitched ? <Card as="span" {...props} /> : <span {...props} />;
}
