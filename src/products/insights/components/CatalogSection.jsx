import { useState } from 'preact/hooks';
import { Button, Carousel } from '../../../design-system/components/index.js';

export function CatalogSection({ group, renderItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section
      id={`section-${group.id}`}
      className="insights-catalog-section"
      data-category={Boolean(group.categoryName)}
      aria-labelledby={`heading-${group.id}`}
    >
      <Carousel
        headingSurface
        label={group.name}
        headingId={`heading-${group.id}`}
        expanded={expanded}
        action={
          group.items.length > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              aria-controls={`heading-${group.id}-items`}
              aria-label={`${expanded ? 'Recolher' : 'Ver todos de'} ${group.name}`}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Recolher' : `Ver todos · ${group.items.length}`}
            </Button>
          ) : (
            <span className="insights-muted">1 opção</span>
          )
        }
      >
        {group.items.map(renderItem)}
      </Carousel>
      {group.href && expanded && (
        <Button as="a" href={group.href} variant="ghost" size="sm" className="insights-section-explore">
          Explorar seção completa →
        </Button>
      )}
    </section>
  );
}
