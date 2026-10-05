import { Button, Heading } from '../../../design-system/components/index.js';

export function CatalogSections({ groups, renderItem }) {
  return (
    <div className="insights-catalog-sections">
      <nav className="insights-section-index" aria-label="Seções desta página">
        {groups.map((group, index) => (
          <a
            key={group.id}
            href={`#section-${group.id}`}
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById(`section-${group.id}`)
                ?.scrollIntoView({
                  behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                  block: 'start'
                });
            }}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {group.name}
          </a>
        ))}
      </nav>
      {groups.map((group, index) => (
        <section key={group.id} id={`section-${group.id}`} className="insights-catalog-section" aria-labelledby={`heading-${group.id}`}>
          <div className="insights-section-heading">
            <Heading as="h2" level={3} id={`heading-${group.id}`}>
              <span className="insights-section-number">{String(index + 1).padStart(2, '0')}</span>
              {group.name}
            </Heading>
            {group.href ? (
              <Button as="a" href={group.href} variant="ghost" size="sm">
                Explorar {group.total} opções →
              </Button>
            ) : (
              <span className="insights-muted">
                {group.items.length} {group.items.length === 1 ? 'opção' : 'opções'}
              </span>
            )}
          </div>
          <div className="insights-grid">{group.items.map(renderItem)}</div>
        </section>
      ))}
    </div>
  );
}
