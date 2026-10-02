import { useEffect, useState } from 'preact/hooks';

// A cleanup guards stale responses even when a transport does not honor abort.
export function useCatalogResource(loader, id) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
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
