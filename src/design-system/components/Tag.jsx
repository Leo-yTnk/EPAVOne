import { cx } from '../../shared/utils/cx.js';

export function Tag({ onRemove, className='', children, ...props }) {
  if(onRemove){
    return <button className={cx('ds-tag','is-removable',className)} type="button" onClick={onRemove} {...props}>{children}</button>;
  }
  return <span className={cx('ds-tag',className)} {...props}>{children}</span>;
}
