import { Button } from './Button.jsx';

export function ErrorState({ title, description, actionLabel = 'Tentar novamente', onAction }) {
  return (
    <div className="ds-state is-error">
      <span className="ds-state-icon" aria-hidden="true">
        !
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
