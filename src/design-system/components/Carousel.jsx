import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useControlId } from '../behaviors/useControlId.js';
import { observeSize } from '../behaviors/observeSize.js';
import { reducedMotion } from '../behaviors/motion.js';
import { useContentMotion } from '../behaviors/useContentMotion.js';
import { Card } from './Card.jsx';
import { IconButton } from './IconButton.jsx';

// Native touch/trackpad scrolling: no drag handlers, cloning, autoplay or per-item observers.
export function Carousel({ label, headingId, children, action, headingSurface = false, expanded = false, className = '' }) {
  const generatedId = useControlId();
  const titleId = headingId || generatedId;
  const ref = useRef(null);
  useContentMotion(ref, expanded, 0, 'y');
  const [edges, setEdges] = useState({ start: true, end: true });
  useLayoutEffect(() => {
    const node = ref.current;
    let frame;
    const measure = () => {
      const start = node.scrollLeft <= 1;
      const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
      setEdges((previous) => (previous.start === start && previous.end === end ? previous : { start, end }));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const stop = observeSize(node, schedule);
    node.addEventListener('scroll', schedule, { passive: true });
    return () => {
      stop();
      cancelAnimationFrame(frame);
      node.removeEventListener('scroll', schedule);
    };
  }, [children?.length, expanded]);
  const move = (direction) => {
    const node = ref.current;
    node.scrollBy({ left: direction * Math.max(1, node.clientWidth * 0.85), behavior: reducedMotion() ? 'instant' : 'smooth' });
  };
  const Header = headingSurface ? Card : 'div';
  return (
    <div className={`ds-carousel ${className}`} data-expanded={expanded}>
      <Header {...(headingSurface ? { as: 'header' } : {})} className="ds-carousel-heading">
        <h2 id={titleId}>{label}</h2>
        <div className="ds-carousel-actions">
          {action}
          {!expanded && !(edges.start && edges.end) && (
            <div className="ds-carousel-controls">
              <IconButton size="sm" label={`Itens anteriores de ${label}`} disabled={edges.start} onClick={() => move(-1)}>
                ←
              </IconButton>
              <IconButton size="sm" label={`Próximos itens de ${label}`} disabled={edges.end} onClick={() => move(1)}>
                →
              </IconButton>
            </div>
          )}
        </div>
      </Header>
      <div
        ref={ref}
        id={`${titleId}-items`}
        className="ds-carousel-track"
        role="region"
        aria-labelledby={titleId}
        tabIndex={expanded ? undefined : 0}
        onKeyDown={(event) => {
          if (expanded || event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          if (event.key === 'Home' || event.key === 'End')
            ref.current.scrollTo({
              left: event.key === 'Home' ? 0 : ref.current.scrollWidth,
              behavior: reducedMotion() ? 'instant' : 'smooth'
            });
          else move(event.key === 'ArrowRight' ? 1 : -1);
        }}
      >
        {children}
      </div>
    </div>
  );
}
