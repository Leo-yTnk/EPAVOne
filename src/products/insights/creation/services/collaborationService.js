import { authenticatedClient } from '../../../../shared/services/accountService.js';
import * as api from '../repositories/creationRepository.js';
import { result } from './creationService.js';
async function userId() {
  const { data } = await authenticatedClient.auth.getSession();
  if (!data.session?.user?.id) throw new Error('Entre novamente para continuar.');
  return data.session.user.id;
}
export const collaborationService = {
  async sharing(id) {
    await userId();
    const [share, count] = await Promise.all([result(api.fetchShareStatus(id)), result(api.fetchActiveGrantCount(id))]);
    return { share, count };
  },
  async shareAction(id, action) {
    await userId();
    const method = {
      activate: 'activateSharing',
      regenerate: 'regenerateShareCode',
      deactivate: 'deactivateSharing',
      revoke: 'revokeAccess'
    }[action];
    if (!method) throw new Error('Ação inválida.');
    return result(api[method](id));
  },
  async shared() {
    return (await result(api.fetchSharedLibrary(await userId()))).filter((x) => x.recipe);
  },
  async redeem(code) {
    await userId();
    if (!code.trim()) throw new Error('Informe o código compartilhado.');
    const response = await api.redeemShareCode(code);
    if (response.error) throw new Error(response.error.friendly || 'Código indisponível.');
    return response.data;
  },
  async copyContext(id) {
    const user = await userId();
    const detail = await result(api.fetchRecipeDetail(id));
    return api.computeForeignReferences(detail, user);
  },
  async copy(id, resolutions) {
    await userId();
    return result(api.createRecipeCopy(id, resolutions));
  },
  async requests(admin = false) {
    const user = await userId();
    return result(admin ? api.fetchAllChangeRequests() : api.fetchMyChangeRequests(user));
  },
  async revisions(id) {
    await userId();
    return result(api.fetchChangeRequestRevisions(id));
  },
  async requestAction(request, action, note, mode = 'published') {
    await userId();
    if (['reject', 'return'].includes(action) && !note?.trim()) throw new Error('Escreva uma orientação para o autor.');
    if (action === 'cancel') return result(api.cancelChangeRequest(request.id));
    if (action === 'return') return result(api.returnChangeRequest(request.id, note));
    if (action === 'resubmit') {
      const method = { recipe: 'resubmitRecipeRequest', product: 'resubmitProductRequest', category: 'resubmitCategoryRequest' }[
        request.entity_type
      ];
      if (!method) throw new Error('Tipo de solicitação inválido.');
      return result(api[method](request.id, note));
    }
    if (!['approve', 'reject'].includes(action)) throw new Error('Ação inválida.');
    return result(api.reviewChangeRequest(request.id, action, note, mode));
  },
  async dependencies(id) {
    await userId();
    return result(api.checkRecipePublishDependencies(id));
  }
};
