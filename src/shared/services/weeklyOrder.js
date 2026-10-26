// Shared session contract. Workbook personal data stays inside Writer.
let snapshot = { template: null, request: null, templateVersion: 0 };
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
      templateVersion: snapshot.templateVersion + 1,
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
  requestRecipe(recipe, ingredients) {
    publish({
      request: {
        id: crypto.randomUUID(),
        kind: 'recipe',
        name: recipe.name,
        items: ingredients.map((item) => ({
          name: item.product?.name || 'Ingrediente indisponível',
          product_code: item.product?.product_code,
          unit: item.product?.unit,
          quantity: Number(item.quantity)
        })),
        extras: [...(recipe.extras || [])]
      }
    });
  },
  dismiss(id) {
    if (snapshot.request?.id === id) publish({ request: null });
  }
};
