// Shared session contract. Workbook personal data stays inside Writer.
let snapshot = { template: null, request: null };
const listeners = new Set();
function publish(patch) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener(snapshot));
}
export const weeklyOrder = {
  get: () => snapshot,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  attach(template) {
    publish({
      template: template
        ? {
            filename: template.filename,
            period: { ...template.period },
            products: template.products.map(({ name, code, price }) => ({ name, code, price }))
          }
        : null
    });
  },
  request(product) {
    publish({ request: { id: crypto.randomUUID(), name: product.name, product_code: product.product_code } });
  },
  dismiss(id) {
    if (snapshot.request?.id === id) publish({ request: null });
  }
};
