import { cx } from '../../shared/utils/cx.js';

export function Option({ selected=false, highlighted=false, disabled=false, children, className='', ...props }) {
  return <button
    className={cx('ds-option',highlighted&&'is-highlighted',className)}
    type="button"
    role="option"
    tabIndex="-1"
    aria-selected={selected}
    aria-disabled={disabled||undefined}
    disabled={disabled}
    {...props}
  >{children}</button>;
}
