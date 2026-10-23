import { useLayoutEffect, useState } from 'preact/hooks';
import { selectionGeometry } from '../behaviors/selectionGeometry.js';
import { useSelectionDrag } from '../behaviors/useSelectionDrag.js';
import { Card } from './Card.jsx';

export function SelectionIndicator({ containerRef, value, stitched = false, orientation = 'horizontal' }) {
  const [geometry, setGeometry] = useState(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const selected = container?.querySelector('[aria-current], [aria-selected="true"]');
    if (!container || !selected) {
      setGeometry(null);
      return;
    }
    const update = () => {
      const box = selectionGeometry(container, selected);
      const next = {
        '--selection-x': box.x + 'px',
        '--selection-y': box.y + 'px',
        '--selection-width': box.width + 'px',
        '--selection-height': box.height + 'px'
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
  useSelectionDrag(containerRef, stitched, value, orientation);
  const props = {
    className: `ds-selection-indicator${stitched ? ' is-stitched' : ''}`,
    'aria-hidden': 'true',
    'data-ready': Boolean(geometry),
    style: geometry ?? undefined
  };
  return stitched ? <Card as="span" {...props} /> : <span {...props} />;
}
