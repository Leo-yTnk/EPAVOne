import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="ds-state">
      <span className="ds-state-icon" aria-hidden="true">
        <Icon name="search" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
