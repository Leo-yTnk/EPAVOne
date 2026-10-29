// Policy points, not fitted probabilities. See docs/commercial-intelligence.md.
export const PRIORITY_WEIGHTS = Object.freeze({ commitment: 30, recency: 25, intent: 20, planned: 10, history: 5, catalog: 10 });
export const validDate = (day) =>
  typeof day === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(day) &&
  Number.isFinite(Date.parse(day + 'T12:00:00Z')) &&
  new Date(day + 'T12:00:00Z').toISOString().slice(0, 10) === day;
const collator = new Intl.Collator('pt-BR');
const compare = (a, b) => collator.compare(String(a), String(b)) || (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const displayDay = (day) => dayFormatter.format(new Date(day + 'T12:00:00Z'));
const age = (date, now) => Math.floor((Date.parse(now + 'T12:00:00Z') - Date.parse(date + 'T12:00:00Z')) / 86400000);
export function relationshipIndex(state, now) {
  const active = new Set((state.customers || []).map((c) => c.id));
  const index = new Map([...active].map((id) => [id, { contacts: [], commitments: [] }]));
  if (!validDate(now)) return index;
  const dates = new Map();
  const observedDay = (day) => {
    if (!dates.has(day)) dates.set(day, validDate(day) && day <= now);
    return dates.get(day);
  };
  for (const item of state.interactions || []) {
    if (active.has(item.customerId) && observedDay(item.date) && ['bought', 'interested', 'later', 'declined'].includes(item.outcome))
      index.get(item.customerId).contacts.push(item);
  }
  for (const item of state.commitments || []) {
    if (active.has(item.customerId) && !item.done && validDate(item.due)) index.get(item.customerId).commitments.push(item);
  }
  for (const data of index.values()) {
    data.contacts.sort((a, b) => compare(b.date, a.date) || compare(a.id || '', b.id || ''));
    data.commitments.sort((a, b) => compare(a.due, b.due) || compare(a.id || '', b.id || ''));
  }
  return index;
}
export function customerPriority(customer, data, week, now, catalogCount = 0) {
  const contact = data.contacts[0];
  const due = data.commitments.filter((item) => item.due <= now);
  const elapsed = contact ? age(contact.date, now) : null;
  const frequency = Number.isInteger(customer.frequencyDays) && customer.frequencyDays > 0 ? customer.frequencyDays : null;
  const entry = week?.queue?.find((item) => item.customerId === customer.id);
  const enough = validDate(now) && Boolean(contact || due.length || customer.intent === true);
  const recentDecline = contact?.outcome === 'declined' && elapsed < 7;
  const futureReturn = data.commitments.find((item) => item.due > now);
  const deferred = !due.length && (recentDecline || (contact?.outcome === 'later' && Boolean(futureReturn)));
  const weights = PRIORITY_WEIGHTS;
  const factors = [
    {
      label: due.length ? `${due.length} retorno(s) combinado(s) até hoje` : 'Nenhum retorno vencido',
      points: due.length ? weights.commitment : 0
    },
    {
      label:
        elapsed === null
          ? 'Sem contato datado: recência desconhecida'
          : `${elapsed} dias desde o contato · frequência desejada ${frequency || 'não informada'}`,
      points: elapsed !== null && frequency ? Math.round(weights.recency * Math.min(1, elapsed / frequency)) : 0
    },
    { label: 'Intenção de compra declarada', points: customer.intent === true ? weights.intent : 0 },
    { label: 'Incluído na semana selecionada', points: entry && !entry.outcome ? weights.planned : 0 },
    { label: 'Compra registrada em atendimento', points: data.contacts.some((item) => item.outcome === 'bought') ? weights.history : 0 },
    { label: 'Produto real alinhado às preferências comerciais', points: catalogCount > 0 ? weights.catalog : 0 },
    { label: 'Recusa recente: respeitar espaço', points: recentDecline ? -30 : 0 },
    { label: 'Já atendido na semana selecionada', points: entry?.outcome ? -40 : 0 }
  ];
  const score = enough
    ? Math.max(
        0,
        Math.min(
          100,
          factors.reduce((sum, item) => sum + item.points, 0)
        )
      )
    : null;
  const reason = due.length
    ? `Retorno combinado para ${displayDay(due[0].due)}. ${due[0].text}`
    : deferred
      ? recentDecline
        ? 'Recusa registrada há menos de 7 dias. Respeite o espaço antes de oferecer novamente.'
        : `Cliente pediu para falar depois. Próximo combinado: ${displayDay(futureReturn.due)}.`
      : entry?.outcome
        ? 'Já existe resultado nesta semana. Revise o histórico antes de planejar outro contato.'
        : customer.intent
          ? 'Há intenção de compra registrada. Confirme se a necessidade continua atual.'
          : elapsed !== null && frequency && elapsed >= frequency
            ? `Último contato há ${elapsed} dias; frequência desejada de ${frequency} dias.`
            : !enough
              ? 'Sem histórico datado, retorno vencido ou intenção declarada. Conheça a rotina antes de priorizar.'
              : 'Considere o contexto e a frequência desejada antes de iniciar outra conversa.';
  let action = { label: 'Conhecer o perfil', href: `#/planner/clientes/${customer.id}`, kind: 'profile' };
  if (due.length) action = { label: 'Retomar o combinado', href: `#/planner/clientes/${customer.id}/combinados`, kind: 'followup' };
  else if (entry && !entry.outcome && !deferred)
    action = { label: 'Preparar conversa', href: `#/planner/semana/preparar/${customer.id}`, kind: 'prepare' };
  else if (enough && !deferred && !entry)
    action = { label: 'Considerar para a semana', href: `#/planner/clientes/${customer.id}`, kind: 'consider' };
  return {
    customerId: customer.id,
    name: customer.name,
    score,
    factors,
    reason,
    action,
    deferred,
    due: due.length,
    completed: Boolean(entry?.outcome),
    insufficient: enough ? null : 'Dados insuficientes para pontuar',
    catalogCount
  };
}
export function rankCustomers(state, week, now, matches = new Map()) {
  const index = relationshipIndex(state, now);
  return (state.customers || [])
    .map((c) => customerPriority(c, index.get(c.id), week, now, matches.get(c.id)?.products.length || 0))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || compare(a.name, b.name) || compare(a.customerId, b.customerId));
}
