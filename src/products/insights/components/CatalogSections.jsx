import { CatalogSection } from './CatalogSection.jsx';
import { reducedMotion } from '../../../design-system/behaviors/motion.js';

export function CatalogSections({ groups, renderItem, index = true }) {
  return (
    <div className="insights-catalog-sections">
      {index && groups.length > 1 && (
        <nav className="insights-section-index" aria-label="Seções desta página">
          {groups.map((group, index) => (
            <a
              key={group.id}
              href={`#section-${group.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(`section-${group.id}`)?.scrollIntoView({
                  behavior: reducedMotion() ? 'instant' : 'smooth',
                  block: 'start'
                });
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {group.name}
            </a>
          ))}
        </nav>
      )}
      {groups.map((group) => (
        <CatalogSection key={group.id} group={group} renderItem={renderItem} />
      ))}
    </div>
  );
}
