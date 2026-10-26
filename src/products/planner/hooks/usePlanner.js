import { useEffect, useRef, useState } from 'preact/hooks';
import { plannerService } from '../services/plannerService.js';
export function usePlanner(service = plannerService) {
  const [resource, setResource] = useState({ loading: true, state: null, error: '', volatile: false });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState(false);
  const current = useRef(null);
  const epoch = useRef(0);
  const lock = useRef(false);
  const mounted = useRef(true);
  async function reload() {
    if (lock.current || !mounted.current) return false;
    const generation = epoch.current;
    lock.current = true;
    setRefreshing(true);
    setSaveError(false);
    setNotice('');
    if (!current.current) setResource((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const result = await service.load();
      if (!mounted.current || epoch.current !== generation) return false;
      current.current = result.state;
      setResource({ ...result, loading: false, error: '' });
      return true;
    } catch (error) {
      if (mounted.current && epoch.current === generation) {
        if (current.current) {
          setNotice(`Não foi possível atualizar: ${error.message} Seus dados em tela foram preservados.`);
          setSaveError(true);
        } else setResource((previous) => ({ ...previous, loading: false, error: error.message }));
      }
      return false;
    } finally {
      if (mounted.current && epoch.current === generation) {
        lock.current = false;
        setRefreshing(false);
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    epoch.current++;
    lock.current = false;
    current.current = null;
    setBusy(false);
    setResource({ loading: true, state: null, error: '', volatile: false });
    reload();
    return () => {
      mounted.current = false;
      epoch.current++;
      lock.current = false;
    };
  }, [service]);
  async function act(command, message = 'Planejamento atualizado.') {
    if (lock.current || !current.current || !mounted.current) return false;
    const generation = epoch.current;
    lock.current = true;
    setBusy(true);
    setNotice('');
    setSaveError(false);
    try {
      const result = await service.update(current.current, command);
      if (!mounted.current || epoch.current !== generation) return false;
      current.current = result.state;
      setResource({ ...result, loading: false, error: '' });
      setNotice(message);
      return true;
    } catch (error) {
      if (mounted.current && epoch.current === generation) {
        setNotice(error.message);
        setSaveError(true);
      }
      return false;
    } finally {
      if (mounted.current && epoch.current === generation) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  return { ...resource, busy, refreshing, notice, saveError, act, reload };
}
