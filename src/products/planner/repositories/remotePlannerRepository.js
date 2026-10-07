import { authenticatedClient } from '../../../shared/services/accountService.js';
import { validateSnapshot } from './plannerRepository.js';
import { defaultOffers } from './defaultOffers.js';
import { emptyWeek, weekStart } from '../models/planner.js';
const empty = (now) => ({
  version: 1,
  customers: [],
  interactions: [],
  commitments: [],
  offers: structuredClone(defaultOffers),
  weeks: [emptyWeek(weekStart(now))]
});
function check(result) {
  if (result.error) {
    if (result.error.code === '40001') throw new Error('O planejamento mudou em outra sessão. Recarregue antes de salvar novamente.');
    if (['42P01', 'PGRST202', 'PGRST205'].includes(result.error.code))
      throw new Error('Planner remoto não configurado. O administrador precisa conferir e aplicar somente a migration 041.');
    throw new Error('Não foi possível acessar o planejamento. Seus dados não foram substituídos.');
  }
  return result.data;
}
export function createRemotePlannerRepository(client = authenticatedClient) {
  let revision = 0;
  let ownerId;
  const equivalent = (a, b) => {
    const canonical = (value) =>
      Array.isArray(value)
        ? value.map(canonical)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((key) => [key, canonical(value[key])])
            )
          : value;
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  };
  async function identity() {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.id) throw new Error('Entre novamente para acessar seu planejamento.');
    return data.user.id;
  }
  async function sales(id) {
    const rows = [];
    for (let offset = 0; ; offset = rows.length) {
      const page = check(
        await client
          .from('sales')
          .select('id,sale_date,value,ipc')
          .eq('owner_id', id)
          .order('sale_date')
          .order('id')
          .range(offset, offset + 499)
      );
      if (!Array.isArray(page)) throw new Error('Histórico de vendas inválido.');
      rows.push(...page);
      if (!page.length) return rows;
    }
  }
  return {
    async load(now) {
      ownerId = await identity();
      const [row, history] = await Promise.all([
        client.from('epav_planner_workspaces').select('state,revision').eq('owner_id', ownerId).maybeSingle().then(check),
        sales(ownerId)
      ]);
      revision = row?.revision || 0;
      const state = validateSnapshot(row?.state || empty(now));
      return { state: { ...state, sales: history }, volatile: false, remote: true };
    },
    async save(state) {
      if ((await identity()) !== ownerId) throw new Error('A conta mudou. Recarregue o Planner.');
      validateSnapshot(state);
      const { sales: _sales, ...snapshot } = state;
      const response = await client.rpc('save_epav_planner_workspace', { p_state: snapshot, p_expected_revision: revision });
      if (response.error) {
        // A timeout may follow a successful commit. Reconcile instead of inserting twice.
        const row = check(await client.from('epav_planner_workspaces').select('state,revision').eq('owner_id', ownerId).maybeSingle());
        if (row?.revision !== revision + 1 || !equivalent(row.state, snapshot)) check(response);
        revision = row.revision;
      } else revision = check(response).revision;
      const history = await sales(ownerId);
      return { state: { ...snapshot, sales: history }, volatile: false, remote: true };
    }
  };
}
