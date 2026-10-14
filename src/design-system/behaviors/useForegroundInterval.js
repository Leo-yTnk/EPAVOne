import { useEffect, useRef } from 'preact/hooks';

// Only UI clocks use this hook. Network jobs and save/export operations must
// continue using their own lifecycle and are never suspended by visibility.
export function useForegroundInterval(callback, delay, enabled = true) {
  const current = useRef(callback);
  current.current = callback;
  useEffect(() => {
    if (!enabled) return;
    let timer;
    const refresh = () => {
      if (!document.hidden) current.current();
    };
    const synchronize = () => {
      clearInterval(timer);
      refresh();
      if (!document.hidden) timer = setInterval(refresh, delay);
    };
    synchronize();
    document.addEventListener('visibilitychange', synchronize);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', synchronize);
      window.removeEventListener('focus', refresh);
    };
  }, [delay, enabled]);
}
