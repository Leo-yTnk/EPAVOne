import { daysSince, lastInteraction, priority, recommendations, today, weekStart } from './planner.js';

export const attendanceLink = (id) => '#/planner/semana/atender' + (id ? '/' + id : '');
export const preparationLink = (id) => '#/planner/semana/preparar/' + id;
export function orderedQueue(week) {
  return [...week.queue].sort((a, b) => Number(a.role === 'reserve') - Number(b.role === 'reserve'));
}
export function contactDue(customer, state, now = today()) {
  const elapsed = daysSince(lastInteraction(customer, state.interactions)?.date, now);
  return elapsed === null || elapsed >= customer.frequencyDays;
}
export function pendingCommitments(state) {
  const active = new Set(state.customers.map((customer) => customer.id));
  return state.commitments.filter((item) => !item.done && active.has(item.customerId)).sort((a, b) => a.due.localeCompare(b.due));
}
export function nextAction(state, week) {
  if (!state.customers.length)
    return {
      title: 'Conheça seu primeiro cliente',
      description: 'Comece pelo nome. Preferências e detalhes podem vir depois.',
      label: 'Cadastrar primeiro cliente',
      href: '#/planner/clientes'
    };
  if (!week.queue.length)
    return {
      title: 'Quem você quer atender?',
      description: 'Escolha clientes da carteira para organizar esta semana.',
      label: 'Escolher clientes da semana',
      href: '#/planner/clientes'
    };
  if (week.id !== weekStart())
    return {
      title: 'Revise o planejamento',
      description: 'Você está consultando outra semana. Os atendimentos são registrados na semana atual.',
      label: 'Revisar semana',
      href: '#/planner/semana'
    };
  const next = orderedQueue(week).find((entry) => !entry.outcome);
  if (!next)
    return {
      title: 'Conversas registradas',
      description: 'Revise os retornos combinados e o que aprendeu nesta semana.',
      label: 'Revisar resultados',
      href: '#/planner/resultados'
    };
  const customer = state.customers.find((item) => item.id === next.customerId);
  return {
    title: customer.name,
    description: customer.preparation.trim()
      ? 'Abordagem pronta. Confira o contexto e comece a conversa.'
      : 'Reserve um momento para preparar a abordagem antes de conversar.',
    label: customer.preparation.trim() ? 'Iniciar atendimento' : 'Preparar próxima conversa',
    href: customer.preparation.trim() ? attendanceLink(customer.id) : preparationLink(customer.id)
  };
}
const fold = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
export function selectClients(state, week, { query = '', segment = '', filter = '', campaign = '', opportunities = false }) {
  const planned = new Set(week.queue.map((entry) => entry.customerId));
  const commitments = new Set(
    pendingCommitments(state)
      .filter((item) => item.due <= today())
      .map((item) => item.customerId)
  );
  return state.customers
    .filter((customer) => {
      if (
        !fold([customer.name, customer.position, ...customer.tags].join(' ')).includes(fold(query)) ||
        (segment && customer.segment !== segment)
      )
        return false;
      if (filter === 'intent' && !customer.intent) return false;
      if (filter === 'new' && lastInteraction(customer, state.interactions)) return false;
      if (filter === 'unprepared' && customer.preparation.trim()) return false;
      if (filter === 'due' && !commitments.has(customer.id)) return false;
      if (filter === 'unplanned' && planned.has(customer.id)) return false;
      if (!opportunities) return true;
      if (campaign === 'contact') return (daysSince(lastInteraction(customer, state.interactions)?.date, today()) ?? Infinity) >= 21;
      return recommendations(customer, state.offers).some((offer) => !campaign || offer.id === campaign);
    })
    .map((customer) => ({ customer, score: priority(customer, state).score }))
    .sort((a, b) => b.score - a.score || a.customer.name.localeCompare(b.customer.name))
    .map(({ customer }) => customer);
}
