export { matchText } from './matchText.js';
export { matchProduct } from './productMatching.js';
export { matchClients } from './clientMatching.js';
export function orderSummary(template, order) {
  return {
    client: order.client,
    room: order.room,
    filename: template.filename,
    period: { ...template.period },
    units: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    amountCents: order.lines.reduce(
      (sum, line) => sum + Math.round(template.products.find((item) => item.name === line.name).price * 100) * line.quantity,
      0
    ),
    products: order.lines.map((line) => ({ name: line.name, quantity: line.quantity }))
  };
}
