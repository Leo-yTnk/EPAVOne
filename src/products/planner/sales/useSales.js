import { useEffect, useRef, useState } from 'preact/hooks';
import { salesRepository } from '../../../shared/services/salesRepository.js';
export function useSales(enabled, start, end, repository = salesRepository) {
  const [state, setState] = useState({ rows: [], loading: false, error: '' });
  const [busy, setBusy] = useState(false);
  const version = useRef(0),
    life = useRef(0),
    locked = useRef(false),
    mounted = useRef(true);
  const options = useRef({ enabled, start, end, repository });
  options.current = { enabled, start, end, repository };
  useEffect(() => {
    mounted.current = true;
    life.current++;
    locked.current = false;
    setBusy(false);
    return () => {
      mounted.current = false;
      life.current++;
      version.current++;
    };
  }, [enabled, repository]);
  async function load() {
    const query = options.current;
    if (!query.enabled || locked.current || !mounted.current) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.start) || !/^\d{4}-\d{2}-\d{2}$/.test(query.end) || query.start > query.end) {
      setState({ rows: [], loading: false, error: 'Defina um período de datas válido.' });
      return;
    }
    const run = ++version.current;
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const rows = await query.repository.list(query.start, query.end);
      if (run === version.current && mounted.current) setState({ rows, loading: false, error: '' });
    } catch (error) {
      if (run === version.current && mounted.current) setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }
  useEffect(() => {
    setState({ rows: [], loading: false, error: '' });
    load();
    return () => {
      version.current++;
    };
  }, [enabled, start, end, repository]);
  async function mutate(action) {
    if (locked.current || !enabled || !mounted.current) return false;
    const generation = life.current;
    version.current++;
    locked.current = true;
    setBusy(true);
    setState((current) => ({ ...current, loading: false, error: '' }));
    try {
      await action();
      if (!mounted.current || generation !== life.current) return false;
      locked.current = false;
      await load();
      return true;
    } catch (error) {
      if (mounted.current && generation === life.current) setState((current) => ({ ...current, error: error.message }));
      return false;
    } finally {
      if (mounted.current && generation === life.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  return {
    ...state,
    busy,
    reload: load,
    save: (order) => mutate(() => repository.save(order)),
    remove: (row) => mutate(() => repository.remove(row))
  };
}
