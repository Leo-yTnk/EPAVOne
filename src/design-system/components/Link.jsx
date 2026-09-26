import { cx } from '../../shared/utils/cx.js';
export function Link({ className='', children, ...props }) { return <a className={cx('ds-link',className)} {...props}>{children}</a>; }