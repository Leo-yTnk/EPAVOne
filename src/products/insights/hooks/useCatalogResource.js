import { publicResource, refreshPublicResource } from '../services/publicResourceCache.js';
import { useEffect, useState } from 'preact/hooks';

// A cleanup guards stale responses even when a transport does not honor abort.
export function useCatalogResource(loader, id) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() =>
    loader.publicCatalog ? publicResource(loader, id).state : { loading: true, data: null, error: null }
  );
  useEffect(() => {
    if (loader.publicCatalog) {
      const entry = publicResource(loader, id);
      entry.listeners.add(setState);
      setState(entry.state);
      refreshPublicResource(entry, loader, id, attempt > 0);
      return () => entry.listeners.delete(setState);
    }
    let active = true;
    const controller = new AbortController();
    setState({ loading: true, data: null, error: null });
    Promise.resolve()
      .then(() => loader(id, { signal: controller.signal }))
      .then(
        (data) => active && setState({ loading: false, data, error: null }),
        (error) => active && setState({ loading: false, data: null, error: error.message || 'Não foi possível carregar o catálogo.' })
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [loader, id, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
