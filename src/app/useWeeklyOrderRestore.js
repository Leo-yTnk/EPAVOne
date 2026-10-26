import { useEffect } from 'preact/hooks';
import { weeklyOrder } from '../shared/services/weeklyOrder.js';
// Restore the public product projection even when opening Insights or Planner first.
export function useWeeklyOrderRestore(product) {
  useEffect(() => {
    if (product === 'writer' || weeklyOrder.get().template) return;
    let active = true;
    const version = weeklyOrder.get().templateVersion;
    import('../products/writer/services/sessionTemplate.js')
      .then(async (session) => {
        const attachment = await session.sessionTemplate.load();
        if (!attachment || !active) return;
        const parser = await import('../products/writer/services/templateService.js');
        if (!active) return;
        const template = await parser.importTemplate(session.restoreTemplateFile(attachment));
        if (active && weeklyOrder.get().templateVersion === version) weeklyOrder.attach(template);
      })
      .catch(() => {
        /* Writer offers restoration feedback and a replacement control. */
      });
    return () => {
      active = false;
    };
  }, [product]);
}
