import { Card, Skeleton } from '../../../design-system/components/index.js';
export function CatalogLoading({ label = 'Carregando catálogo…', spotlight = false }) {
  if (spotlight)
    return (
      <div className="insights-spotlight" aria-busy="true" aria-label={label}>
        <Card className="insights-image">
          <Skeleton className="insights-placeholder-image" />
        </Card>
        <Skeleton variant="title" />
        <Skeleton />
      </div>
    );
  return (
    <section className="insights-catalog" aria-busy="true" aria-label={label}>
      <p role="status" className="insights-muted">
        {label}
      </p>
      <Skeleton variant="title" />
      <div className="insights-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="insights-placeholder">
            <Card className="insights-image">
              <Skeleton className="insights-placeholder-image" />
            </Card>
            <Skeleton variant="title" />
            <Skeleton />
          </div>
        ))}
      </div>
    </section>
  );
}
