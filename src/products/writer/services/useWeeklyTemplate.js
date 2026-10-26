import { useEffect, useState } from 'preact/hooks';
import { weeklyOrder } from '../../../shared/services/weeklyOrder.js';
import { sessionTemplate, restoreTemplateFile } from './sessionTemplate.js';
import { importTemplate } from './templateService.js';
export function useWeeklyTemplate() {
  const [template, setTemplate] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [storageWarning, setStorageWarning] = useState('');
  useEffect(() => {
    if (!restoring) weeklyOrder.attach(template);
  }, [template, restoring]);
  useEffect(() => {
    let current = true;
    sessionTemplate
      .load()
      .then(async (attachment) => {
        if (!attachment) return;
        const restored = await importTemplate(restoreTemplateFile(attachment));
        if (current) setTemplate(restored);
      })
      .catch((failure) => {
        if (current)
          setStorageWarning(`Não foi possível restaurar o Excel desta sessão. ${failure.message || 'Carregue o arquivo novamente.'}`);
      })
      .finally(() => {
        if (current) setRestoring(false);
      });
    return () => {
      current = false;
    };
  }, []);
  return { template, setTemplate, restoring, storageWarning, setStorageWarning };
}
