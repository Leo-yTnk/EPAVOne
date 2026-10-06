import { useLayoutEffect, useState } from 'preact/hooks';

export function SelectionIndicator({ containerRef, value }) {
  const [geometry, setGeometry] = useState(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const selected = container?.querySelector('[aria-current], [aria-selected="true"]');
    if (!container || !selected) return;
    const update = () => {
      const outer = container.getBoundingClientRect();
      const inner = selected.getBoundingClientRect();
      const next = {
        '--selection-x': inner.left - outer.left + container.scrollLeft - container.clientLeft + 'px',
        '--selection-y': inner.top - outer.top + container.scrollTop - container.clientTop + 'px',
        '--selection-width': inner.width + 'px',
        '--selection-height': inner.height + 'px'
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
  return <span className="ds-selection-indicator" aria-hidden="true" data-ready={Boolean(geometry)} style={geometry ?? undefined} />;
}
