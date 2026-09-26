import { cx } from '../../shared/utils/cx.js';

export function Tag({ removable=false, className='', children, ...props }) {
  const Component = removable ? 'button' : 'span';
  return <Component className={cx('ds-tag', removable && 'is-removable', className)} type={removable ? 'button' : undefined} {...props}>{children}</Component>;
}
