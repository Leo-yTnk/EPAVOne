import { createCatalogPriceSync } from './catalogPriceSync.js';
import { authenticatedClient } from '../../../../shared/services/accountService.js';
import * as api from '../repositories/creationRepository.js';
import { result } from './creationService.js';
import { reviewCatalogImport } from '../admin/importReview.js';
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
  async observations() {
    await requireAdmin();
    return result(api.fetchSwiftObservations());
  },
  async acceptMetadata(item, selected) {
    await requireAdmin();
    if (!selected?.name && !selected?.image) throw new Error('Selecione uma alteração para salvar.');
    return result(api.acceptSwiftMetadata(item.product_id, item.checked_at, item.product.version, selected));
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
  async importCatalog(modes, payload, replacements = [], onProgress = () => {}) {
    await requireAdmin();
    if (Object.values(modes).some((mode) => mode !== 'add')) throw new Error('Esta importação aceita somente Adicionar novos.');
    onProgress({ value: 10, label: 'Conferindo permissões e duplicatas' });
    const review = reviewCatalogImport(payload, await adminService.context());
    if (review.errors.length) throw new Error(review.errors.join('\n'));
    if (!Array.isArray(replacements)) throw new Error('Escolhas de duplicatas inválidas.');
    for (const choice of replacements) {
      const duplicate = review.groups[choice.entity]?.[choice.index];
      if (!duplicate || duplicate.status !== 'ignored' || duplicate.existing?.id !== choice.id)
        throw new Error('A identidade desta duplicata mudou. Prepare a prévia novamente.');
      const existing = duplicate.existing;
      if (choice.entity === 'sections' ? existing.updated_at !== choice.updated_at : existing.version !== choice.version)
        throw new Error('Este registro mudou desde a comparação. Prepare a prévia novamente antes de substituir.');
    }
    onProgress({ value: 40, label: 'Gravando catálogo em uma única transação', waiting: true });
    return result(replacements.length ? api.adminImportReviewedCatalog(payload, replacements) : api.adminAddPublicCatalog(payload));
  },
  async exportBackup() {
    await requireAdmin();
    return result(api.exportCatalogBackup());
  },
  async restoreBackup(backup) {
    await requireAdmin();
    return result(api.restoreCatalogBackup(backup));
  },
  async cleanup(mode, password) {
    await requireAdmin();
    if (!password) throw new Error('Informe sua senha para confirmar.');
    return result(mode === 'inactive' ? api.adminDeleteInactiveCatalogItems(password) : api.adminDeleteAllProductsAndRecipes(password));
  }
};

export const catalogPriceSync = createCatalogPriceSync({
  loadProducts: async () => {
    await requireAdmin();
    return result(api.fetchAdminProducts());
  },
  refreshBatch: (ids) => api.refreshProductPriceBatch(ids)
});
