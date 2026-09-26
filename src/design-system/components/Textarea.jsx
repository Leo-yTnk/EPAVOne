import { cx } from '../../shared/utils/cx.js';

export function Textarea({ label, helper, error, success=false, id, className='', ...props }) {
  return <label className="ds-field" htmlFor={id}>
    <span className="ds-input-label">{label}</span>
    <textarea id={id} className={cx('ds-textarea',error&&'is-error',success&&'is-success',className)} {...props}/>
    {error ? <span className="ds-input-error">{error}</span> : helper ? <span className="ds-input-helper">{helper}</span> : null}
  </label>;
}
