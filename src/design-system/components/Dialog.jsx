import { useRef } from 'preact/hooks';
import { useModalLayer } from '../behaviors/useModalLayer.js';
import { IconButton } from './IconButton.jsx';
import { Portal } from './Portal.jsx';

export function Dialog({ open, title, children, actions, onClose }) {
  const dialogRef=useRef(null);
  useModalLayer(dialogRef,open,onClose);
  if(!open) return null;

  return <Portal><div className="ds-dialog-overlay" onMouseDown={event=>event.target===event.currentTarget&&onClose?.()}>
    <section ref={dialogRef} className="ds-dialog ds-stitched-card" role="dialog" aria-modal="true" aria-labelledby="ds-dialog-title" tabIndex="-1">
      <div className="ds-dialog-head"><h2 id="ds-dialog-title" className="ds-dialog-title">{title}</h2><IconButton label="Fechar" onClick={onClose}>×</IconButton></div>
      <div className="ds-dialog-content">{children}</div>
      {actions&&<div className="ds-dialog-actions">{actions}</div>}
    </section>
  </div></Portal>;
}
