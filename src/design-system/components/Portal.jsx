import { createPortal } from 'preact/compat';
import { useContext } from 'preact/hooks';
import { ModalExitContext } from '../behaviors/modalPresence.js';

export function Portal({ children, retainOnExit = false }) {
  const exiting = useContext(ModalExitContext);
  if (exiting && !retainOnExit) return null;
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
