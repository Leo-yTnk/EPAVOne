import { cx } from '../../shared/utils/cx.js';

export function Card({ as: Component='article', className='', children, ...props }) {
  return <Component className={cx('ds-card', 'ds-stitched-card', className)} {...props}>{children}</Component>;
}
