import { useRef } from 'preact/hooks';
import { ModalExitContext } from '../behaviors/modalPresence.js';
import { useExitPresence } from '../behaviors/useExitPresence.js';

// Keep the last modal subtree for its exit, without DOM copies or delayed actions.
export function ModalPresence({ children }) {
  const last = useRef(null);
  const wasOpen = useRef(false);
  const generation = useRef(0);
  const open = Boolean(children);
  const present = useExitPresence(open);
  if (open) {
    if (!wasOpen.current) generation.current += 1;
    last.current = children;
  }
  wasOpen.current = open;
  if (!present) {
    last.current = null;
    return null;
  }
  return (
    <ModalExitContext.Provider key={generation.current} value={!open}>
      {open ? children : last.current}
    </ModalExitContext.Provider>
  );
}
