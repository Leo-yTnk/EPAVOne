import { cx } from '../../shared/utils/cx.js';

export function ActionGroup({ children, align = 'end', className = '', ...props }) {
  return (
    <div className={cx('ds-action-group', className)} data-align={align} {...props}>
      {children}
    </div>
  );
}
