import { validDay, validateCustomer, OUTCOMES } from '../models/planner.js';
import { demoData } from './demoData.js';
const KEY = 'epavone-planner-demo-v1';
export function validateSnapshot(state) {
  if (state?.version !== 1 || !['customers', 'interactions', 'commitments', 'weeks', 'offers'].every((key) => Array.isArray(state[key])))
    throw new Error('Dados locais do Planner inválidos. Os dados foram preservados; restaure uma cópia válida no navegador.');
  const ids = new Set();
  for (const customer of state.customers) {
    if (
      !customer.id ||
      ids.has(customer.id) ||
      !['name', 'segment', 'context', 'notes', 'preparation', 'position'].every((key) => typeof customer[key] === 'string') ||
      !['preferences', 'restrictions', 'tags'].every((key) => Array.isArray(customer[key])) ||
      !Number.isInteger(customer.frequencyDays) ||
      ![...customer.preferences, ...customer.restrictions, ...customer.tags].every((value) => typeof value === 'string')
    )
      throw new Error('Perfil local inválido. Os dados existentes foram preservados.');
    validateCustomer(customer);
    ids.add(customer.id);
  }
  for (const week of state.weeks)
    if (
      !validDay(week.id) ||
      !Number.isInteger(week.goal) ||
      week.goal < 1 ||
      week.goal > 100 ||
      !Array.isArray(week.queue) ||
      week.queue.some(
        (entry) =>
          !ids.has(entry.customerId) || !['primary', 'reserve'].includes(entry.role) || (entry.outcome !== null && !OUTCOMES[entry.outcome])
      ) ||
      new Set(week.queue.map((entry) => entry.customerId)).size !== week.queue.length
    )
      throw new Error('Semana local inválida. Os dados existentes foram preservados.');
  if (new Set(state.weeks.map((week) => week.id)).size !== state.weeks.length) throw new Error('Semanas duplicadas.');
  for (const item of state.interactions)
    if (!ids.has(item.customerId) || !validDay(item.date) || !OUTCOMES[item.outcome]) throw new Error('Histórico local inválido.');
  for (const item of state.commitments)
    if (!ids.has(item.customerId) || !validDay(item.due) || typeof item.text !== 'string' || typeof item.done !== 'boolean')
      throw new Error('Combinado local inválido.');
  for (const offer of state.offers)
    if (
      !offer.id ||
      typeof offer.title !== 'string' ||
      typeof offer.query !== 'string' ||
      !Array.isArray(offer.categories) ||
      !offer.categories.every((value) => typeof value === 'string')
    )
      throw new Error('Sugestão local inválida.');
  return state;
}
export function createPlannerRepository(storage = () => localStorage) {
  let memory;
  let pending = false;
  return {
    async load(now) {
      if (pending && memory) return { state: memory, volatile: true };
      let raw;
      try {
        raw = storage().getItem(KEY);
      } catch {
        return { state: memory || demoData(now), volatile: true };
      }
      if (raw) {
        try {
          return { state: validateSnapshot(JSON.parse(raw)), volatile: false };
        } catch (error) {
          throw new Error(`Não foi possível ler o planejamento: ${error.message}`);
        }
      }
      return { state: memory || demoData(now), volatile: false };
    },
    async save(state) {
      validateSnapshot(state);
      try {
        storage().setItem(KEY, JSON.stringify(state));
        memory = state;
        pending = false;
        return { state, volatile: false };
      } catch {
        memory = state;
        pending = true;
        return { state, volatile: true };
      }
    }
  };
}
export const plannerRepository = createPlannerRepository();
