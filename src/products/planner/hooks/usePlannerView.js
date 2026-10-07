import { useState } from 'preact/hooks';
import { plannerViewService } from '../services/plannerViewService.js';
export function usePlannerView(key, defaults) {
  const [values, setValues] = useState(() => plannerViewService.read(key, defaults));
  function update(patch) {
    setValues((current) => {
      const next = { ...current, ...patch };
      plannerViewService.save(key, next);
      return next;
    });
  }
  return [values, update];
}
