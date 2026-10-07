export const OUTCOMES = {
  bought: 'Comprou',
  interested: 'Interessado',
  later: 'Falar depois',
  declined: 'Não interessado',
  unavailable: 'Indisponível'
};
export const SEGMENTS = ['Famílias', 'Praticidade', 'Churrasco', 'Exploração'];
export const INTERESTS = ['aves', 'bovinos', 'suínos', 'pescados', 'padaria', 'sobremesas', 'complementos', 'feijão'];
export function validDay(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(value + 'T12:00:00Z').getTime()) &&
    new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value
  );
}
export function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}
export function shiftDay(day, count) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function weekStart(day = today()) {
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay();
  return shiftDay(day, -((weekday + 6) % 7));
}
export function daysSince(day, now) {
  return day ? Math.max(0, Math.floor((new Date(now + 'T12:00:00Z') - new Date(day + 'T12:00:00Z')) / 86400000)) : null;
}
export function dateLabel(day) {
  return day
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(day + 'T12:00:00Z'))
    : 'Nunca registrado';
}
export const money = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);
export function compatible(customer, offer) {
  return !offer.categories.some((category) => customer.restrictions.includes(category));
}
export function recommendations(customer, offers) {
  return offers
    .filter((offer) => compatible(customer, offer) && offer.categories.some((category) => customer.preferences.includes(category)))
    .map((offer) => ({
      ...offer,
      reason: `Combina com a preferência por ${offer.categories.filter((category) => customer.preferences.includes(category)).join(', ')}. Confira disponibilidade e condições no Excel da semana.`
    }));
}
export function lastInteraction(customer, interactions) {
  return interactions
    .filter((item) => item.customerId === customer.id && item.outcome !== 'unavailable')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
export function priority(customer, state, now = today()) {
  const contact = lastInteraction(customer, state.interactions);
  const elapsed = daysSince(contact?.date, now);
  const planned = state.weeks.find((week) => week.id === weekStart(now))?.queue.find((entry) => entry.customerId === customer.id);
  const recent = contact && daysSince(contact.date, now) < 7;
  const factors = [
    { label: customer.intent ? 'Intenção de compra registrada' : 'Sem promessa de compra', points: customer.intent ? 25 : 0 },
    {
      label: `Frequência desejada: ${customer.frequencyDays} dias`,
      points: elapsed === null || elapsed >= customer.frequencyDays ? 10 : 0
    },
    {
      label: elapsed === null ? 'Ainda sem contato' : `${elapsed} dias desde o contato`,
      points: elapsed === null ? 20 : elapsed >= 21 ? 15 : elapsed >= 7 ? 8 : 0
    },
    {
      label: 'Histórico de compras',
      points: state.interactions.some((item) => item.customerId === customer.id && item.outcome === 'bought') ? 10 : 0
    },
    { label: 'Aderência a sugestões compatíveis', points: recommendations(customer, state.offers).length ? 15 : 0 },
    { label: 'Cobertura da carteira: sem contato neste mês', points: !contact || contact.date.slice(0, 7) !== now.slice(0, 7) ? 10 : 0 },
    { label: customer.preparation.trim() ? 'Abordagem preparada' : 'Preparação pendente', points: customer.preparation.trim() ? 10 : -5 },
    {
      label: recent && contact.outcome === 'declined' ? 'Recusa recente: respeitar espaço' : 'Sem recusa recente',
      points: recent && contact.outcome === 'declined' ? -30 : 0
    },
    { label: planned?.outcome ? 'Já atendido nesta semana' : 'Disponível para planejamento', points: planned?.outcome ? -40 : 0 }
  ];
  return {
    score: Math.min(
      100,
      Math.max(
        0,
        factors.reduce((sum, item) => sum + item.points, 0)
      )
    ),
    factors
  };
}
export function performance(state, week) {
  const interactions = state.interactions.filter((item) => item.weekId === week.id);
  const contacted = interactions.filter((item) => item.outcome !== 'unavailable');
  const bought = interactions.filter((item) => item.outcome === 'bought');
  const customers = new Set(contacted.map((item) => item.customerId)).size;
  const buyers = new Set(bought.map((item) => item.customerId)).size;
  const measured = bought.filter((item) => Number.isInteger(item.amountCents) && Number.isInteger(item.units));
  return {
    attempts: interactions.length,
    attended: customers,
    buyers,
    conversion: customers ? Math.round((buyers / customers) * 100) : 0,
    revenue: measured.reduce((sum, item) => sum + item.amountCents, 0),
    ticket: measured.length ? Math.round(measured.reduce((sum, item) => sum + item.amountCents, 0) / measured.length) : null,
    ipc: measured.length ? measured.reduce((sum, item) => sum + item.units, 0) / measured.length : null,
    coverage: state.customers.length ? Math.round((customers / state.customers.length) * 100) : 0,
    planned: week.queue.filter((entry) => entry.role === 'primary').length,
    done: week.queue.filter((entry) => entry.role === 'primary' && entry.outcome).length,
    measured: measured.length,
    unmeasured: bought.length - measured.length
  };
}
export function emptyWeek(id) {
  return { id, goal: 8, queue: [] };
}
export function validateCustomer(customer) {
  if (!customer.name.trim()) throw new Error('Informe o nome do cliente.');
  if (customer.name.length > 160 || customer.notes.length > 4000 || customer.preparation.length > 4000 || customer.context.length > 4000)
    throw new Error('Revise os textos: nome até 160 caracteres e observações/abordagem até 4.000.');
  if (
    !SEGMENTS.includes(customer.segment) ||
    ![...customer.preferences, ...customer.restrictions].every((value) => INTERESTS.includes(value))
  )
    throw new Error('Revise o segmento e as categorias comerciais.');
  if (customer.preferences.some((category) => customer.restrictions.includes(category)))
    throw new Error('Uma categoria não pode ser preferência e restrição ao mesmo tempo.');
  if (!Number.isInteger(customer.frequencyDays) || customer.frequencyDays < 1 || customer.frequencyDays > 365)
    throw new Error('A frequência deve estar entre 1 e 365 dias.');
}
