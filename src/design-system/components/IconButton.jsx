import { cx } from '../../shared/utils/cx.js';

export function IconButton({ size='md', label, className='', children, ...props }) {
  return <button className={cx('ds-icon-btn', size !== 'md' && 'ds-icon-btn-' + size, className)} aria-label={label} {...props}>{children}</button>;
}
