import { authenticatedClient as client } from '../../../../shared/services/accountService.js';
import * as repository from '../repositories/creationRepository.js';
import { lines, validateEditor } from '../models/editor.js';

export async function result(promise) {
  const { data, error } = await promise;
  if (error) {
    const message = error.message?.includes('version_conflict')
      ? 'Este conteúdo foi alterado em outra sessão. Copie suas alterações e reabra o editor para carregar a versão atual.'
      : error.code === '42501'
        ? 'Sua conta não tem permissão para esta operação. Confira a sessão e o acesso ao conteúdo.'
        : error.code === '23503'
          ? 'Uma categoria ou produto usado neste conteúdo deixou de estar disponível. Reabra o editor para atualizar as opções.'
          : error.code === '23505'
            ? 'Já existe um conteúdo com esses dados. Confira o nome e os vínculos antes de salvar.'
            : error.code === 'PGRST116'
              ? 'O conteúdo não está mais disponível para esta conta. Feche o editor e atualize a biblioteca.'
              : error.code === 'PGRST202'
                ? 'Uma função necessária ainda não está instalada. Execute o diagnóstico do banco indicado na documentação de criação.'
                : error.message || 'Não foi possível concluir a operação.';
    throw Object.assign(new Error(message), { code: error.code });
  }
  return data;
}
const normalizeRows = (data) => (Array.isArray(data) ? data : []);
async function sessionUser() {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.user) throw new Error('Entre novamente para continuar.');
  return data.session.user;
}
export function createCreationService(api = repository, db = client, getUser = sessionUser) {
  return {
    async load(type, scope = 'personal') {
      const user = await getUser();
      const list = {
        recipes: ['fetchMyRecipes', 'fetchAdminRecipes'],
        products: ['fetchMyProducts', 'fetchAdminProducts'],
        categories: ['fetchMyCategories', 'fetchAdminCategories']
      }[type];
      if (!list) throw new Error('Tipo de conteúdo inválido.');
      return normalizeRows(await result(api[list[scope === 'site' ? 1 : 0]](user.id)));
    },
    async vocabulary(scope) {
      const user = await getUser();
      const [categories, personalProducts, publicProducts, structure] = await Promise.all([
        result(scope === 'site' ? api.fetchAdminCategories() : api.fetchCreationCategories()),
        result(scope === 'site' ? api.fetchAdminProducts() : api.fetchMyProducts(user.id)),
        scope === 'site' ? [] : result(api.fetchPublicProducts()),
        scope === 'site' ? result(api.fetchAdminCatalogStructure()) : null
      ]);
      const products = [...personalProducts, ...publicProducts];
      return { categories, products, structure };
    },
    async detail(type, item) {
      // Products and categories need a fresh row too: list data can be stale
      // after another session edits the item, including its version or price source.
      if (type !== 'recipes') item = await result(api.fetchCreationItem(type, item.id));
      if (item.scope === 'site' && ['recipes', 'products'].includes(type)) {
        const structure = await result(api.fetchAdminCatalogStructure());
        const sections = structure[type]
          .filter((x) => x[type === 'recipes' ? 'recipe_id' : 'product_id'] === item.id)
          .map((x) => ({ category_id: x.section_id }));
        return type === 'recipes' ? { ...(await result(api.fetchRecipeDetail(item.id))), sections } : { item, sections };
      }
      if (type === 'recipes') return result(api.fetchRecipeDetail(item.id));
      if (type === 'products') return { item, sections: await result(api.fetchProductSections(item.id)) };
      return { item };
    },
    async save(type, scope, item, values) {
      const problem = validateEditor(type, values);
      if (problem) throw new Error(problem);
      const user = await getUser();
      if (type === 'recipes')
        return result(
          db.rpc('save_creation_recipe', {
            p_id: item?.id || null,
            p_scope: scope,
            p_expected_version: item?.version ?? null,
            p_fields: {
              name: values.name.trim(),
              category_id: values.categoryId,
              prep_time: Number(values.prepTime),
              servings: Number(values.servings),
              difficulty: values.difficulty,
              image_url: values.imageUrl || null,
              status: scope === 'site' ? values.status : 'private',
              featured: Boolean(values.featured),
              instructions: lines(values.instructions),
              extras: lines(values.extras),
              tips: lines(values.tips)
            },
            p_ingredients: values.ingredients.map((x) => ({ product_id: x.productId, quantity: Number(x.quantity) })),
            p_sections: values.sections
          })
        );
      if (type === 'products')
        return result(
          db.rpc('save_creation_product', {
            p_id: item?.id || null,
            p_scope: scope,
            p_expected_version: item?.version ?? null,
            p_fields: {
              name: values.name.trim(),
              category_id: values.categoryId,
              unit: values.unit,
              price: Number(values.price),
              image_url: values.imageUrl || null,
              active: values.active,
              swift_product_url: values.swiftUrl || null
            },
            p_sections: values.sections
          })
        );
      const fields = { name: values.name.trim(), type: values.type, active: values.active };
      if (item?.id)
        return result(
          scope === 'site'
            ? api.updateSiteCategory(item.id, { name: fields.name, active: fields.active })
            : api.updateCategoryName(item.id, fields.name)
        );
      return result(scope === 'site' ? api.createSiteCategory(fields) : api.createCategory(user.id, fields));
    },
    async toggle(type, item) {
      await getUser();
      return result(type === 'products' ? api.setProductActive(item.id, !item.active) : api.setCategoryActive(item.id, !item.active));
    },
    async impact(type, id) {
      await getUser();
      return result(
        api[{ recipes: 'getRecipeDeleteImpact', products: 'getProductDeleteImpact', categories: 'getCategoryDeleteImpact' }[type]](id)
      );
    },
    async remove(type, id, options) {
      await getUser();
      const method = { recipes: 'deleteRecipeChecked', products: 'deleteProductResolved', categories: 'deleteCategoryResolved' }[type];
      return result(api[method](id, options));
    },
    async submit(type, id, reason) {
      await getUser();
      return result(
        api[{ recipes: 'submitRecipeRequest', products: 'submitProductRequest', categories: 'submitCategoryRequest' }[type]](id, reason)
      );
    }
  };
}
export const creationService = createCreationService();
