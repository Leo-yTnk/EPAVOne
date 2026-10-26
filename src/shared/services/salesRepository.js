import { authenticatedClient } from './accountService.js';
import { customerIdentity, validateSale } from './sales.js';
function data(result) {
  if (result.error) {
    const error = new Error(
      ['42P01', 'PGRST200', 'PGRST202', 'PGRST205'].includes(result.error.code)
        ? 'Aplique a migration 046 para habilitar os pedidos detalhados.'
        : result.error.code === '40001'
          ? 'Esse registro mudou em outra sessão. Atualize os pedidos antes de editar.'
          : 'Não foi possível salvar ou carregar a venda. Confira a conexão e tente novamente.'
    );
    error.code = result.error.code;
    throw error;
  }
  return result.data;
}
export function createSalesRepository(client = authenticatedClient) {
  async function owner() {
    const result = await client.auth.getUser();
    if (result.error || !result.data.user) throw new Error('Entre na sua conta para registrar vendas.');
    return result.data.user.id;
  }
  return {
    async list(start, end) {
      const id = await owner(),
        rows = [];
      for (;;) {
        const page = data(
          await client
            .from('sales')
            .select('id,sale_date,value,ipc,details:epav_sale_details(order_data,revision)')
            .eq('owner_id', id)
            .gte('sale_date', start)
            .lte('sale_date', end)
            .order('sale_date', { ascending: false })
            .order('id')
            .range(rows.length, rows.length + 199)
        );
        rows.push(...page.map((row) => ({ ...row, details: Array.isArray(row.details) ? row.details[0] : row.details })));
        if (page.length < 200) return rows;
      }
    },
    async find(id) {
      const uid = await owner();
      const row = data(
        await client
          .from('sales')
          .select('id,sale_date,value,ipc,details:epav_sale_details(order_data,revision)')
          .eq('owner_id', uid)
          .eq('id', id)
          .maybeSingle()
      );
      return row ? { ...row, details: Array.isArray(row.details) ? row.details[0] : row.details } : null;
    },
    async save(order) {
      const errors = validateSale(order);
      if (errors.length) throw new Error(errors.join(' '));
      await owner();
      const { id, revision, ...payload } = order;
      const customerKey = customerIdentity(order.customer);
      return data(await client.rpc('save_epav_sale', { p_id: id, p_revision: revision || 0, p_order: { ...payload, customerKey } }));
    },
    async remove(row) {
      await owner();
      return data(await client.rpc('delete_epav_sale', { p_id: row.id, p_revision: row.details?.revision || 0 }));
    }
  };
}
export const salesRepository = createSalesRepository();
