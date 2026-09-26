import { useId, useRef } from 'preact/hooks';
import { useModalLayer } from '../behaviors/useModalLayer.js';
import { IconButton } from './IconButton.jsx';
import { Portal } from './Portal.jsx';

export function Drawer({ open, title, children, onClose }) {
  const ref=useRef(null);
  const titleId=useId();
  useModalLayer(ref,open,onClose);
  if(!open) return null;

  return <Portal><div className="ds-drawer-overlay" onMouseDown={event=>event.target===event.currentTarget&&onClose?.()}>
    <aside ref={ref} className="ds-drawer ds-stitched-card" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
      <div className="ds-drawer-header"><h2 id={titleId} className="ds-drawer-title">{title}</h2><IconButton label="Fechar" onClick={onClose}>×</IconButton></div>
      {children}
    </aside>
  </div></Portal>;
}
