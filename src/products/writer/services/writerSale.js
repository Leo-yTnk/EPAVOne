import { orderCpf, saoPauloDay } from '../models/order.js';
export function writerSale(template, order, id) {
  const customer = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const student = template.students.find((item) => item.name === order.student && item.room === order.room);
  const store = template.stores.find((item) => item.name === order.store);
  return {
    id,
    revision: 0,
    source: 'writer',
    saleDate: saoPauloDay(),
    template: { filename: template.filename, period: { ...template.period } },
    customer: {
      name: order.client,
      room: order.room,
      cpf: orderCpf(template, order),
      phone: order.phone,
      email: customer?.email || '',
      birth: customer?.birth ?? null,
      address: customer?.address || ''
    },
    student: { name: order.student, room: order.room, email: student?.email || '' },
    delivery: { method: order.method, date: order.date, store: store ? { ...store } : null },
    payment: order.payment,
    shippingCents: 0,
    notes: '',
    lines: order.lines.map((line) => {
      const product = template.products.find((item) => item.name === line.name);
      return {
        name: line.name,
        code: product.code || '',
        quantity: line.quantity,
        unitPrice: product.price,
        unit: product.unit,
        weight: product.weight,
        kit: Boolean(line.kit)
      };
    })
  };
}
