export const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export function saoPauloDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function parseBrazilDate(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) throw new Error('Data inválida no período do formulário.');
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  if (new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) !== iso) throw new Error('Data inválida no período do formulário.');
  return iso;
}

export function addDays(day, count) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function checkPeriod(period, today = saoPauloDay()) {
  if (today < period.start) throw new Error('Este formulário ainda não está válido. Carregue o pedido da semana atual.');
  if (today > period.end) throw new Error('Este formulário venceu. Carregue o pedido da semana atual.');
}

export function validCpf(value) {
  const cpf = String(value ?? '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const length of [9, 10]) {
    const sum = [...cpf.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(cpf[length])) return false;
  }
  return true;
}

export function validPhone(value) {
  const phone = String(value ?? '').replace(/\D/g, '');
  const codes = new Set(
    '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(
      ' '
    )
  );
  return /^\d{11}$/.test(phone) && codes.has(phone.slice(0, 2));
}

function validZip(value) {
  const zip = String(value ?? '').replace(/\D/g, '');
  return /^\d{8}$/.test(zip) && Number(zip) > 1000000 && Number(zip) < 19999999;
}

export function splitLines(lines, capacity = 12) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacidade inválida.');
  const parts = [];
  for (let index = 0; index < lines.length; index += capacity) parts.push(lines.slice(index, index + capacity));
  return parts;
}

export function deliveryLimits(template, method, today = saoPauloDay()) {
  const home = normalize(method) === 'entrega em casa';
  // Respect the actual Excel bounds, including the known mismatch with its message.
  return { min: today, max: addDays(today, home ? template.deliveryDays.home : template.deliveryDays.pickup) };
}

export function orderCpf(template, order) {
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  return String(order.cpfOverride ?? client?.cpf ?? '').replace(/\D/g, '');
}

export function exportCpf(cpf) {
  const digits = String(cpf).replace(/\D/g, '');
  if (!validCpf(digits)) throw new Error('Informe um CPF válido com 11 dígitos.');
  return digits.startsWith('0') ? '*' + digits : digits;
}

export function validateCustomer(template, order, today = saoPauloDay()) {
  const errors = [];
  if (!template.rooms.includes(order.room)) errors.push('Escolha uma sala disponível no formulário.');
  const student = template.students.find((item) => item.name === order.student && item.room === order.room);
  if (!student || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email))
    errors.push('Selecione um aluno da sala com e-mail escolar cadastrado.');
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  if (!client) errors.push('Selecione um cliente cadastrado nesta sala.');
  else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) errors.push('O cliente precisa de e-mail válido na base do formulário.');
    if (!validCpf(orderCpf(template, order))) errors.push('Informe ou corrija o CPF do cliente: 11 dígitos válidos.');
    if (
      !Number.isFinite(client.birth) ||
      client.birth <= 0 ||
      client.birth > (Date.parse(`${today}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000
    )
      errors.push('A data de nascimento do cliente está ausente ou inválida na base.');
  }
  if (!validPhone(order.phone)) errors.push('Informe um telefone com DDD válido e 11 dígitos.');
  return errors;
}

export function validateDelivery(template, order, today = saoPauloDay()) {
  const errors = [];
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  if (!template.methods.includes(order.method)) errors.push('Escolha uma modalidade de entrega ou retirada.');
  if (normalize(order.method) === 'entrega em casa') {
    const address = (client?.address ?? '').split(',').map((part) => part.trim());
    if (address.length < 5 || !address[0] || !address[1] || !address[3] || !validZip(address[4]))
      errors.push(
        'O endereço de entrega precisa estar completo na base, com rua, número, complemento (pode estar vazio), bairro e CEP separados por vírgulas. O CEP precisa atender à faixa de São Paulo exigida no Excel.'
      );
  } else if (order.method) {
    const store = template.stores.find((item) => item.name === order.store);
    if (!store || !store.street || !store.number || !store.neighborhood || !validZip(store.zip))
      errors.push('Escolha uma loja com endereço completo e CEP na faixa permitida pelo Excel (São Paulo).');
    if (normalize(order.method).includes('mercado j&f') && order.store !== template.market)
      errors.push('Selecione o Mercado J&F para esta modalidade.');
    if (normalize(order.method).includes('outras lojas') && order.store === template.market)
      errors.push('Selecione uma das outras lojas para esta modalidade.');
  }
  if (!template.payments.includes(order.payment)) errors.push('Escolha uma forma de pagamento disponível.');
  const bounds = deliveryLimits(template, order.method, today);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(order.date ?? '') ||
    !Number.isFinite(Date.parse(order.date)) ||
    new Date(`${order.date}T12:00:00Z`).toISOString().slice(0, 10) !== order.date ||
    order.date < bounds.min ||
    order.date > bounds.max
  )
    errors.push(`A data deve estar entre ${bounds.min} e ${bounds.max}, conforme a validação do Excel.`);
  return errors;
}

export function validateProducts(template, order) {
  const errors = [];
  if (!order.lines?.length) errors.push('Adicione pelo menos um produto.');
  const seen = new Set();
  for (const line of order.lines ?? []) {
    const product = template.products.find((item) => item.name === line.name);
    if (!product || !Number.isFinite(product.price) || product.price <= 0)
      errors.push(`Produto sem preço válido no formulário: ${line.name}.`);
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > 9999)
      errors.push(`Quantidade inválida: ${line.name}.`);
    if (seen.has(line.name)) errors.push(`Produto repetido no carrinho: ${line.name}.`);
    if (line.kit && !template.kitOptions.includes('sim')) errors.push('O formulário não permite marcar kit.');
    seen.add(line.name);
  }
  return [...new Set(errors)];
}

export function validateOrder(template, order, today = saoPauloDay()) {
  const errors = [];
  try {
    checkPeriod(template.period, today);
  } catch (error) {
    errors.push(error.message);
  }
  return [
    ...new Set([
      ...errors,
      ...validateCustomer(template, order, today),
      ...validateProducts(template, order),
      ...validateDelivery(template, order, today)
    ])
  ];
}
