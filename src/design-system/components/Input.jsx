import { cx } from '../../shared/utils/cx.js';
import { useControlId } from '../behaviors/useControlId.js';

export function Input({ label, helper, error, success = false, id, className = '', 'aria-describedby': describedBy, ...props }) {
  const generatedId = useControlId();
  const controlId = id || generatedId;
  const messageId = controlId + '-message';
  const description = [describedBy, (error || helper) && messageId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="ds-field">
      {label && (
        <label className="ds-input-label" htmlFor={controlId}>
          {label}
        </label>
      )}
      <input
        id={controlId}
        className={cx('ds-input', error && 'is-error', success && 'is-success', className)}
        aria-describedby={description}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {(error || helper) && (
        <span id={messageId} className={error ? 'ds-input-error' : 'ds-input-helper'}>
          {error || helper}
        </span>
      )}
    </div>
  );
}
