import { cx } from '../../shared/utils/cx.js';
import { IconButton } from './IconButton.jsx';
import { Portal } from './Portal.jsx';

export function Toast({ tone='info', title, children, onDismiss }) {
  return <div className={cx('ds-toast','is-'+tone)} role={tone==='error'?'alert':'status'}>
    <div className="ds-toast-content">{title&&<strong>{title}</strong>}{title&&children?<br/>:null}{children}</div>
    {onDismiss&&<IconButton size="sm" label="Fechar notificação" onClick={onDismiss}>×</IconButton>}
  </div>;
}

export function ToastRegion({ children }) {
  return <Portal><div className="ds-toast-region" aria-live="polite" aria-atomic="true">{children}</div></Portal>;
}
