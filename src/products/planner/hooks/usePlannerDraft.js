import { useLayoutEffect, useState } from 'preact/hooks';

// A refresh updates clean fields, while an unfinished local edit stays recoverable.
export function usePlannerDraft(saved) {
  const [draft, setDraft] = useState({ base: saved, value: saved, conflict: false });
  useLayoutEffect(() => {
    setDraft((current) => {
      if (current.base === saved) return current;
      const dirty = current.value !== current.base;
      return { base: saved, value: dirty ? current.value : saved, conflict: dirty && current.value !== saved };
    });
  }, [saved]);
  function change(value) {
    setDraft((current) => ({ ...current, value, conflict: current.conflict && value !== current.base }));
  }
  return [draft.value, change, draft.conflict];
}
