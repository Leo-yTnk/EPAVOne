import { cx } from '../../shared/utils/cx.js';

export function Badge({ tone='default', className='', children, ...props }) {
  return <span className={cx('ds-badge', tone !== 'default' && 'is-' + tone, className)} {...props}>{children}</span>;
}
