import { useEffect, useState } from 'preact/hooks';
export function useCreationResource(loader, key) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let current = true;
    setState({ loading: true, data: null, error: '' });
    Promise.resolve()
      .then(loader)
      .then(
        (data) => {
          if (current) setState({ loading: false, data, error: '' });
        },
        (error) => {
          if (current) setState({ loading: false, data: null, error: error.message });
        }
      );
    return () => {
      current = false;
    };
  }, [key, attempt]);
  return { ...state, reload: () => setAttempt((x) => x + 1) };
}
