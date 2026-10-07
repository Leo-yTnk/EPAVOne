import { useState } from 'preact/hooks';
import { commercialContext } from '../../../shared/services/commercialContext.js';
import { useCommercialContext } from '../../../shared/services/useCommercialContext.js';
export function usePlannerHandoff() {
  const context = useCommercialContext();
  const [linkedId, setLinkedId] = useState(null);
  return {
    context,
    apply(client, order, change, setStep) {
      change({
        client: client.name,
        room: client.room,
        student: client.room === order.room ? order.student : '',
        phone: client.phone || '',
        cpfOverride: undefined
      });
      setLinkedId(context?.id || null);
      setStep(0);
    },
    reset: () => setLinkedId(null),
    exported: () => {
      if (linkedId) commercialContext.exported(linkedId);
    }
  };
}
