// Session-only contract: no customer identity or credentials are put in URLs.
let current = null;
const listeners = new Set();
export const commercialContext = {
  get: () => current,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  begin(context) {
    const same = current && context.customerId === current.customerId && context.weekId === current.weekId;
    current = same ? { ...current, ...context } : { ...context, id: crypto.randomUUID(), orderStatus: 'pending' };
    listeners.forEach((listener) => listener(current));
    return current;
  },
  invalidate(contextId) {
    if (current?.id !== contextId || current.orderStatus !== 'exported') return;
    current = { ...current, orderStatus: 'pending', summary: null };
    listeners.forEach((listener) => listener(current));
  },
  exported(contextId, summary) {
    if (current?.id !== contextId) return;
    current = { ...current, orderStatus: 'exported', summary };
    listeners.forEach((listener) => listener(current));
  },
  clear() {
    current = null;
    listeners.forEach((listener) => listener(current));
  }
};
export function insightsProductLink(query) {
  return '#/insights/produtos/busca/' + encodeURIComponent(query);
}
