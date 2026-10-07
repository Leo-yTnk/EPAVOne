import { Button, Card, Icon } from '../../../design-system/components/index.js';

export function CatalogChoices({ title, description, icon, choices }) {
  return (
    <Card as="section" className="insights-choices" aria-label={title}>
      <div className="insights-choices-heading">
        <Icon name={icon} />
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="insights-choice-buttons">
        {choices.map((choice) => (
          <Button
            key={choice.label}
            size="sm"
            variant={choice.active ? 'primary' : 'ghost'}
            aria-pressed={choice.active}
            onClick={choice.onSelect}
          >
            {choice.label} <span className="insights-choice-count">{choice.count}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
