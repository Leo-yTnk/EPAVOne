import { cx } from '../../shared/utils/cx.js';
export function Toast({ tone='info', children }) { return <div className={cx('ds-toast','is-'+tone)} role="status"><div className="ds-toast-content">{children}</div></div>; }
export function ToastRegion({ children }) { return <div className="ds-toast-region" aria-live="polite" aria-atomic="true">{children}</div>; }