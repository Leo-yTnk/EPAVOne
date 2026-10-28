import { forwardRef } from 'preact/compat';
import { cx } from '../../shared/utils/cx.js';
import { Spinner } from './Spinner.jsx';

export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    radius,
    align,
    className = '',
    children,
    disabled = false,
    ...props
  },
  ref
) {
  const isButton = Component === 'button';
  return (
    <Component
      ref={ref}
      className={cx(
        'ds-btn',
        'ds-btn-' + variant,
        size !== 'md' && 'ds-btn-' + size,
        loading && 'is-loading',
        fullWidth && 'ds-btn-block',
        radius === 'nested' && 'ds-btn-nested',
        align === 'between' && 'ds-btn-between',
        align === 'start' && 'ds-btn-start',
        className
      )}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? 'true' : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </Component>
  );
});
