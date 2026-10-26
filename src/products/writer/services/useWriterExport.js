import { useRef, useState } from 'preact/hooks';
import { exportOrder, downloadExport } from './exportService.js';
import { writerSale } from './writerSale.js';
import { orderSummary } from '../../../shared/services/orderMatching.js';
export function useWriterExport({ template, order, handoff, setBusy, setSuccess }) {
  const id = useRef(crypto.randomUUID());
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  function clear() {
    setError('');
    setDraft(null);
  }
  return {
    error,
    draft,
    clear,
    reset() {
      clear();
      id.current = crypto.randomUUID();
    },
    async download() {
      setBusy(true);
      clear();
      setSuccess('');
      try {
        const output = await exportOrder(template, order);
        downloadExport(output);
        const next = writerSale(template, order, id.current);
        next.export = { filename: output.filename, files: output.count, generatedAt: new Date().toISOString() };
        setDraft(next);
        handoff.exported({ ...orderSummary(template, order), saleDraft: next });
        setSuccess(`${output.count} ${output.count === 1 ? 'formulário pronto' : 'formulários prontos'} para conferência no Excel.`);
      } catch (failure) {
        setError(failure.message);
      } finally {
        setBusy(false);
      }
    }
  };
}
