import { useEffect, useRef, useState } from 'preact/hooks';
import { plannerService } from '../services/plannerService.js';
export function usePlanner(service = plannerService) {
  const [resource, setResource] = useState({ loading: true, state: null, error: '', volatile: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const mounted = useRef(true);
  async function reload() {
    setResource((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await service.load();
      if (mounted.current) setResource({ ...result, loading: false, error: '' });
    } catch (error) {
      if (mounted.current) setResource((current) => ({ ...current, loading: false, error: error.message }));
    }
  }
  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
    };
  }, []);
  async function act(command, message = 'Planejamento atualizado.') {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setNotice('');
    try {
      const result = await service.update(resource.state, command);
      if (mounted.current) {
        setResource({ ...result, loading: false, error: '' });
        setNotice(message);
      }
      return true;
    } catch (error) {
      if (mounted.current) setNotice(error.message);
      return false;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { ...resource, busy, notice, act, reload };
}
