import { useEffect, useState } from 'preact/hooks';
import { commercialContext } from './commercialContext.js';
export function useCommercialContext() {
  const [context, setContext] = useState(commercialContext.get);
  useEffect(() => {
    setContext(commercialContext.get());
    return commercialContext.subscribe(setContext);
  }, []);
  return context;
}
