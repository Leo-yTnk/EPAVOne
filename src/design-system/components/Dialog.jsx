import { useControlId } from '../behaviors/useControlId.js';
import { useDialogExpansion } from '../behaviors/useDialogExpansion.js';
import { Icon } from './Icon.jsx';
import { CardStitch } from './CardStitch.jsx';
import { useRef } from 'preact/hooks';
import { useModalLayer } from '../behaviors/useModalLayer.js';
import { IconButton } from './IconButton.jsx';
import { Portal } from './Portal.jsx';

export function Dialog({
  open,
  title,
  titleId: contentTitleId,
  titleInContent = false,
  children,
  actions,
  onClose,
  size = 'md',
  stitched = true,
  expandFromTrigger = false,
  className = ''
}) {
  const dialogRef = useRef(null);
  const generatedTitleId = useControlId();
  const titleId = contentTitleId || generatedTitleId;
  useDialogExpansion(dialogRef, open, expandFromTrigger);
  useModalLayer(dialogRef, open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <div className="ds-dialog-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
        <section
          ref={dialogRef}
          className={`ds-dialog${stitched ? ' ds-stitched-card' : ''}${size === 'lg' ? ' is-large' : ''} ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex="-1"
        >
          <div className="ds-dialog-head">
            {!titleInContent && (
              <h2 id={titleId} className="ds-dialog-title">
                {title}
              </h2>
            )}
            <IconButton label="Fechar" onClick={onClose}>
              <Icon name="close" />
            </IconButton>
          </div>
          <div className="ds-dialog-content">{children}</div>
          {actions && <div className="ds-dialog-actions">{actions}</div>}
          {stitched && <CardStitch />}
        </section>
      </div>
    </Portal>
  );
}
