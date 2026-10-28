import { useLayoutEffect, useState } from 'preact/hooks';

export function useDebouncedValue(value, delay = 150) {
  const [settled, setSettled] = useState(value);
  useLayoutEffect(() => {
    // Clearing filters must never briefly show an old query.
    if (!value || delay === 0) {
      setSettled(value);
      return;
    }
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return !value || delay === 0 ? value : settled;
}
