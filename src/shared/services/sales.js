export const saleDay = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const canonicalName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
export const cents = (value) => Math.round((Number(value) + Number.EPSILON) * 100);
export const saleMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
export function customerIdentity(customer) {
  const ref = String(customer.cpf || '').trim();
  const digits = ref.replace(/\D/g, '');
  return digits.length === 11 ? 'cpf:' + digits : ref ? 'ref:' + canonicalName(ref) : 'name:' + canonicalName(customer.name);
}
export function newSale(customer = '') {
  return {
    id: crypto.randomUUID(),
    revision: 0,
    source: 'manual',
    saleDate: saleDay(),
    customer: { name: customer },
    student: {},
    delivery: {},
    payment: '',
    shippingCents: 0,
    notes: '',
    lines: [{ name: '', code: '', quantity: 1, unitPrice: '', kit: false }]
  };
}
export function saleTotals(order) {
  const items = new Set(order.lines.map((line) => (line.code?.trim() ? 'code:' + line.code.trim() : 'name:' + canonicalName(line.name))));
  return {
    distinct: items.size,
    units: order.lines.reduce((sum, line) => sum + Number(line.quantity), 0),
    amountCents:
      order.lines.reduce((sum, line) => sum + cents(Number(line.unitPrice) * Number(line.quantity)), 0) + Number(order.shippingCents || 0)
  };
}
export function validateSale(order) {
  const errors = [];
  if (!order.customer?.name?.trim() || order.customer.name.length > 300) errors.push('Informe o nome completo do cliente.');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(order.saleDate || '') ||
    !Number.isFinite(Date.parse(order.saleDate)) ||
    new Date(order.saleDate + 'T12:00:00Z').toISOString().slice(0, 10) !== order.saleDate ||
    order.saleDate > saleDay()
  )
    errors.push('Informe uma data de venda válida, até hoje.');
  if (!order.lines?.length || order.lines.length > 200) errors.push('Inclua de 1 a 200 produtos.');
  const seen = new Set();
  for (const line of order.lines || []) {
    const nameKey = canonicalName(line.name);
    if (seen.has(nameKey)) errors.push('Reúna produtos repetidos em uma única linha, somando as quantidades.');
    seen.add(nameKey);
    if (!line.name?.trim() || line.name.length > 300) errors.push('Informe o nome de todos os produtos (até 300 caracteres).');
    if (!Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity) < 1 || Number(line.quantity) > 9999)
      errors.push('Quantidade deve ser inteira, de 1 a 9999.');
    if (
      line.unitPrice === '' ||
      !Number.isFinite(Number(line.unitPrice)) ||
      Number(line.unitPrice) <= 0 ||
      Number(line.unitPrice) > 1000000
    )
      errors.push('Informe preços unitários maiores que zero, até R$ 1.000.000.');
    if (line.kit && Number(line.quantity) < 2) errors.push('Kit exige pelo menos 2 unidades do produto.');
  }
  if (!Number.isSafeInteger(Number(order.shippingCents || 0)) || Number(order.shippingCents || 0) < 0)
    errors.push('Confira o valor do frete.');
  if (JSON.stringify(order).length > 60000) errors.push('O registro excede o tamanho permitido. Reduza as observações.');
  if (order.lines?.length && saleTotals(order).amountCents > 999999999999) errors.push('O valor da venda excede o limite permitido.');
  if (order.notes?.length > 4000) errors.push('Observações limitadas a 4000 caracteres.');
  return [...new Set(errors)];
}
export function salesMetrics(rows) {
  const detailed = rows.filter((row) => row.details?.order_data?.lines?.length);
  const gross = rows.reduce((sum, row) => sum + cents(row.value), 0);
  const identities = new Map();
  for (const row of detailed) {
    const customer = row.details.order_data.customer;
    const name = canonicalName(customer.name);
    if (String(customer.cpf || '').trim()) {
      const references = identities.get(name) || new Set();
      references.add(customerIdentity(customer));
      identities.set(name, references);
    }
  }
  const customers = new Set();
  let ambiguous = 0;
  for (const row of detailed) {
    const customer = row.details.order_data.customer;
    const name = canonicalName(customer.name),
      references = identities.get(name);
    if (String(customer.cpf || '').trim()) customers.add(customerIdentity(customer));
    else if (references?.size === 1) customers.add([...references][0]);
    else if (references?.size > 1) ambiguous++;
    else customers.add('name:' + name);
  }
  const distinct = detailed.reduce((sum, row) => sum + saleTotals(row.details.order_data).distinct, 0);
  return {
    count: rows.length,
    gross,
    tm: rows.length ? Math.round(gross / rows.length) : null,
    ipc: detailed.length ? distinct / detailed.length : null,
    positivity: customers.size,
    ambiguous,
    legacy: rows.length - detailed.length
  };
}
let transfer = null;
const listeners = new Set();
export const salesTransfer = {
  get: () => transfer,
  send(draft) {
    transfer = structuredClone(draft);
    listeners.forEach((fn) => fn(transfer));
  },
  clear(id) {
    if (transfer?.id === id) {
      transfer = null;
      listeners.forEach((fn) => fn(null));
    }
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
