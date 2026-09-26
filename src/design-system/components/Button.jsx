import { cx } from '../../shared/utils/cx.js';
import { Spinner } from './Spinner.jsx';

export function Button({ as:Component='button', variant='primary', size='md', loading=false, className='', children, disabled=false, ...props }) {
  const isButton=Component==='button';
  return <Component
    className={cx('ds-btn','ds-btn-'+variant,size !== 'md' && 'ds-btn-'+size,loading && 'is-loading',className)}
    disabled={isButton ? disabled || loading : undefined}
    aria-disabled={!isButton && (disabled || loading) ? 'true' : undefined}
    aria-busy={loading || undefined}
    {...props}
  >{loading && <Spinner/>}<span>{children}</span></Component>;
}
