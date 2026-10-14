import { cx } from '../../shared/utils/cx.js';

export function Alert({ tone = 'info', title, children }) {
  const icon = tone === 'success' ? '✓' : tone === 'danger' ? '×' : tone === 'warning' ? '!' : 'ⓘ';
  return (
    <div className={cx('ds-alert', 'is-' + tone)} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="ds-alert-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        {title && <strong>{title}</strong>}
        <div className="ds-alert-content">{children}</div>
      </div>
    </div>
  );
}
