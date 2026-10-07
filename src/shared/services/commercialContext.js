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
    current = { ...context, id: crypto.randomUUID(), orderStatus: 'pending' };
    listeners.forEach((listener) => listener(current));
    return current;
  },
  exported(contextId) {
    if (current?.id !== contextId) return;
    current = { ...current, orderStatus: 'exported' };
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
