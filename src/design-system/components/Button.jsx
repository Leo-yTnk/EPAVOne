import { cx } from '../../shared/utils/cx.js';
import { Spinner } from './Spinner.jsx';

export function Button({ variant='primary', size='md', loading=false, className='', children, disabled=false, ...props }) {
  return <button className={cx('ds-btn', 'ds-btn-' + variant, size !== 'md' && 'ds-btn-' + size, loading && 'is-loading', className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <Spinner />}<span>{children}</span></button>;
}
