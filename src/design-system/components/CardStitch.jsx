import { useLayoutEffect, useRef } from 'preact/hooks';

export function CardStitch({ contrast = false }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      // Explicit dimensions keep SVG percentages from retaining a stale viewport
      // when asynchronous content changes the containing Card's height.
      svg.style.setProperty('--stitch-path-width', `${Math.max(0, entry.contentRect.width - 2)}px`);
      svg.style.setProperty('--stitch-path-height', `${Math.max(0, entry.contentRect.height - 2)}px`);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return (
    <svg ref={ref} className="ds-stitch" aria-hidden="true" focusable="false">
      {contrast && <rect className="ds-stitch-underlay" x="1" y="1" />}
      <rect x="1" y="1" />
    </svg>
  );
}
