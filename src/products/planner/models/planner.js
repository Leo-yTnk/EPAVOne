import { rankCustomers } from '../../../shared/intelligence/priority.js';
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
  const currentWeek = state.weeks.find((week) => week.id === weekStart(now)) || emptyWeek(weekStart(now));
  return (
    rankCustomers(state, currentWeek, now).find((item) => item.customerId === customer.id) || {
      score: null,
      factors: [],
      insufficient: 'Cliente fora da carteira atual'
    }
  );
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
    coverage: state.customers.length
      ? Math.round(
          (new Set(
            contacted.filter((item) => state.customers.some((customer) => customer.id === item.customerId)).map((item) => item.customerId)
          ).size /
            state.customers.length) *
            100
        )
      : 0,
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
