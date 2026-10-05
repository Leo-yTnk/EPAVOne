import { authenticatedClient } from '../../../../shared/services/accountService.js';
import * as api from '../repositories/creationRepository.js';
import { result } from './creationService.js';
export async function requireAdmin() {
  const {
    data: { session }
  } = await authenticatedClient.auth.getSession();
  if (!session?.user?.id) throw new Error('Entre novamente para continuar.');
  const profile = await result(authenticatedClient.from('profiles').select('role').eq('id', session.user.id).single());
  if (profile.role !== 'admin') throw new Error('Esta área exige uma conta administradora.');
}
export const adminService = {
  async context() {
    await requireAdmin();
    const [categories, products, recipes, structure] = await Promise.all([
      result(api.fetchAdminCategories()),
      result(api.fetchAdminProducts()),
      result(api.fetchAdminRecipes()),
      result(api.fetchAdminCatalogStructure())
    ]);
    return { categories, products, recipes, structure };
  },
  async structure() {
    await requireAdmin();
    return result(api.fetchAdminCatalogStructure());
  },
  async saveSection(section, fields) {
    await requireAdmin();
    return result(
      authenticatedClient.rpc('admin_save_creation_section', {
        p_id: section?.id || null,
        p_page_key: fields.page,
        p_name: fields.name.trim(),
        p_sort_order: Number(fields.order),
        p_active: fields.active
      })
    );
  },
  async reorder(page, rows) {
    await requireAdmin();
    return result(
      api.adminReorderCatalogSections(
        page,
        rows.map((row, i) => ({ id: row.id, sort_order: i }))
      )
    );
  },
  async sync(id) {
    await requireAdmin();
    return result(id ? api.refreshProductPrice(id) : api.refreshAllProductPrices());
  },
  async importCatalog(modes, payload) {
    await requireAdmin();
    if (payload.errors.length) throw new Error('Corrija os erros da planilha antes de importar.');
    return result(
      api.adminImportPublicCatalog(
        modes,
        payload.categories,
        payload.products,
        payload.recipes,
        payload.sections,
        payload.recipeSections,
        payload.productSections
      )
    );
  },
  async cleanup(mode, password) {
    await requireAdmin();
    if (!password) throw new Error('Informe sua senha para confirmar.');
    return result(mode === 'inactive' ? api.adminDeleteInactiveCatalogItems(password) : api.adminDeleteAllProductsAndRecipes(password));
  }
};
