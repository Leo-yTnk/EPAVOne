import { useControlId } from '../behaviors/useControlId.js';
import { Icon } from './Icon.jsx';
import { CardStitch } from './CardStitch.jsx';
import { useRef } from 'preact/hooks';
import { useModalLayer } from '../behaviors/useModalLayer.js';
import { IconButton } from './IconButton.jsx';
import { Portal } from './Portal.jsx';
import { useExitPresence } from '../behaviors/useExitPresence.js';
import { ModalExitContext } from '../behaviors/modalPresence.js';

export function Drawer({ open, title, children, onClose, side = 'end', className = '', id }) {
  const ref = useRef(null);
  const titleId = useControlId();
  const present = useExitPresence(Boolean(open));
  useModalLayer(ref, open, onClose);
  if (!present) return null;

  return (
    <ModalExitContext.Provider value={!open}>
      <Portal retainOnExit>
        <div
          className={`ds-drawer-overlay${side === 'start' ? ' is-start' : ''}`}
          data-exiting={!open}
          inert={!open}
          aria-hidden={!open || undefined}
          onMouseDown={(event) => open && event.target === event.currentTarget && onClose?.()}
        >
          <aside
            id={id}
            ref={ref}
            className={`ds-drawer ds-stitched-card${side === 'start' ? ' is-start' : ''} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex="-1"
          >
            <div className="ds-drawer-header">
              <h2 id={titleId} className="ds-drawer-title">
                {title}
              </h2>
              <IconButton label="Fechar" onClick={onClose}>
                <Icon name="close" />
              </IconButton>
            </div>
            {children}
            <CardStitch />
          </aside>
        </div>
      </Portal>
    </ModalExitContext.Provider>
  );
}
