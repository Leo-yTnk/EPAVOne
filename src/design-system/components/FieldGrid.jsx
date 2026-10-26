import { cx } from '../../shared/utils/cx.js';

// Fields align by their labels; helper text never pulls the next control off its row.
export function FieldGrid({ children, columns = 2, className = '', ...props }) {
  return (
    <div className={cx('ds-field-grid', className)} data-columns={columns} {...props}>
      {children}
    </div>
  );
}
