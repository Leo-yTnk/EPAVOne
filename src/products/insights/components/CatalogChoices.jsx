import { Button } from '../../../design-system/components/index.js';

export function CatalogChoices({ title, choices }) {
  return (
    <nav className="insights-choices" aria-label={title}>
      <div className="insights-choice-buttons">
        {choices.map((choice) => (
          <Button
            key={choice.label}
            size="sm"
            variant={choice.active ? 'primary' : 'secondary'}
            aria-pressed={choice.active}
            onClick={choice.onSelect}
          >
            {choice.label} <span className="insights-choice-count">{choice.count}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
