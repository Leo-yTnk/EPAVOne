import { authenticatedClient as supabase } from '../../../../shared/services/accountService.js';
import { normalizeSwiftSyncError } from '../services/swiftSyncErrors.js';

const RECIPE_SELECT =
  'id, recipe_code, owner_id, scope, status, name, category_id, prep_time, servings, difficulty, image_url, featured, extras, instructions, tips, version, created_at, updated_at';
const PRODUCT_SELECT =
  'id, product_code, owner_id, scope, name, category_id, unit, price, active, image_url, version, created_at, updated_at, swift_product_url, swift_product_id, swift_sku, price_cents, regular_price_cents, promo_price_cents, promo_min_quantity, pricing_type, price_unit, price_source, price_last_checked_at, price_last_changed_at, price_last_success_at, price_status, price_error, price_region, price_reference_zip_code, price_source_hash';
const CATEGORY_SELECT = 'id, category_code, owner_id, scope, type, name, slug, sort_order, active, version, created_at, updated_at';

const CATEGORY_MINI_SELECT = 'id, name';
const ADMIN_PRODUCT_SELECT = `${PRODUCT_SELECT}, effective_price_status, category:categories!products_category_id_fkey(${CATEGORY_MINI_SELECT})`;
const CATEGORY_DETAIL_SELECT = 'id, name, type, owner_id, scope, active';

export const PRODUCT_WITH_CATEGORY_SELECT = `${PRODUCT_SELECT}, category:categories!products_category_id_fkey(${CATEGORY_MINI_SELECT})`;

export const RECIPE_WITH_CATEGORY_SELECT = `${RECIPE_SELECT}, category:categories!recipes_category_id_fkey(${CATEGORY_MINI_SELECT})`;

export const RECIPE_DETAIL_WITH_CATEGORY_SELECT = `${RECIPE_SELECT}, category:categories!recipes_category_id_fkey(${CATEGORY_DETAIL_SELECT})`;

export const RECIPE_INGREDIENT_DETAIL_SELECT = `id, product_id, quantity, sort_order, product:products!recipe_ingredients_product_id_fkey(${PRODUCT_SELECT}, category:categories!products_category_id_fkey(${CATEGORY_MINI_SELECT}))`;

export const RECIPE_SECTION_DETAIL_SELECT = `category_id, sort_order, category:categories!recipe_categories_category_id_fkey(${CATEGORY_DETAIL_SELECT})`;

export const RECIPE_SECTION_SLUG_SELECT = `recipe_id, category:categories!recipe_categories_category_id_fkey(slug)`;

export const PRODUCT_SECTION_DETAIL_SELECT = `category_id, sort_order, category:categories!product_categories_category_id_fkey(${CATEGORY_DETAIL_SELECT})`;

function logSupabaseError(operation, error) {
  console.error(`[Supabase] ${operation} failed`, {
    code: error && error.code,
    message: error && error.message,
    details: error && error.details,
    hint: error && error.hint
  });
}
function unwrap({ data, error }, operation) {
  if (error) {
    logSupabaseError(operation, error);
    return { error: { code: error.code, message: error.message, details: error.details, hint: error.hint, operation } };
  }
  return { data };
}

export const ADMIN_PAGE_SIZE = 500;
export async function fetchAllPages(buildQuery, operation, pageSize = ADMIN_PAGE_SIZE) {
  let offset = 0;
  let rows = [];
  for (;;) {
    const { data, error } = await buildQuery(offset, offset + pageSize - 1);
    if (error) {
      logSupabaseError(operation, error);
      return { error: { code: error.code, message: error.message, details: error.details, hint: error.hint, operation } };
    }
    if (!Array.isArray(data)) {
      return { error: { code: 'INVALID_RESPONSE', message: 'O banco retornou uma lista inválida. Tente carregar novamente.', operation } };
    }
    const page = data;
    rows = rows.concat(page);
    // Supabase may cap responses below the requested size. Advance by rows
    // actually received and stop only on an empty page. Never return a partial
    // catalog as success: editors use these rows to replace section membership.
    if (!page.length) break;
    offset += page.length;
  }
  return { data: rows };
}

export async function fetchMyCategories(userId, type) {
  return fetchAllPages((from, to) => {
    let q = supabase.from('categories').select(CATEGORY_SELECT).eq('owner_id', userId).eq('scope', 'personal').order('name').order('id');
    if (type) q = q.eq('type', type);
    return q.range(from, to);
  }, 'fetchMyCategories');
}
export async function fetchCreationCategories() {
  return fetchAllPages(
    (from, to) => supabase.rpc('list_creation_categories').order('scope').order('name').order('id').range(from, to),
    'fetchCreationCategories'
  );
}
export async function fetchCreationItem(type, id) {
  const columns = { products: PRODUCT_WITH_CATEGORY_SELECT, categories: CATEGORY_SELECT }[type];
  if (!columns) throw new Error('Tipo de conteúdo inválido.');
  return unwrap(await supabase.from(type).select(columns).eq('id', id).single(), 'fetchCreationItem');
}
export async function createCategory(ownerId, { type, name }) {
  return unwrap(
    await supabase.from('categories').insert({ owner_id: ownerId, scope: 'personal', type, name }).select(CATEGORY_SELECT).single(),
    'createCategory'
  );
}
export async function updateCategoryName(id, name) {
  return unwrap(await supabase.from('categories').update({ name }).eq('id', id).select(CATEGORY_SELECT).single(), 'updateCategoryName');
}
export async function deleteCategory(id) {
  return unwrap(await supabase.from('categories').delete().eq('id', id), 'deleteCategory');
}
export async function setCategoryActive(id, active) {
  return unwrap(await supabase.from('categories').update({ active }).eq('id', id).select(CATEGORY_SELECT).single(), 'setCategoryActive');
}

export async function getCategoryDeleteImpact(categoryId) {
  return unwrap(await supabase.rpc('get_category_delete_impact', { p_category_id: categoryId }), 'getCategoryDeleteImpact');
}
export async function deleteCategoryResolved(categoryId, resolution) {
  return unwrap(
    await supabase.rpc('delete_category_resolved', { p_category_id: categoryId, p_resolution: resolution || {} }),
    'deleteCategoryResolved'
  );
}
export async function fetchProductRowsForCategory(categoryId) {
  return unwrap(
    await supabase.from('products').select('id, name, product_code, scope').eq('category_id', categoryId),
    'fetchProductRowsForCategory'
  );
}
export async function fetchRecipeRowsForCategory(categoryId) {
  return unwrap(
    await supabase.from('recipes').select('id, name, recipe_code, scope').eq('category_id', categoryId),
    'fetchRecipeRowsForCategory'
  );
}
export async function fetchSectionRowsForCategory(categoryId) {
  return unwrap(
    await supabase
      .from('recipe_categories')
      .select(`recipe_id, recipe:recipes!recipe_categories_recipe_id_fkey(id, name, recipe_code, scope)`)
      .eq('category_id', categoryId),
    'fetchSectionRowsForCategory'
  );
}
export async function fetchProductSectionRowsForCategory(categoryId) {
  return unwrap(
    await supabase
      .from('product_categories')
      .select(`product_id, product:products!product_categories_product_id_fkey(id, name, product_code, scope)`)
      .eq('category_id', categoryId),
    'fetchProductSectionRowsForCategory'
  );
}

export async function fetchMyProducts(userId) {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('products')
        .select(PRODUCT_WITH_CATEGORY_SELECT)
        .eq('owner_id', userId)
        .eq('scope', 'personal')
        .order('name')
        .order('id')
        .range(from, to),
    'fetchMyProducts'
  );
}
export async function createProduct(ownerId, { name, categoryId, unit, price, imageUrl }) {
  return unwrap(
    await supabase
      .from('products')
      .insert({ owner_id: ownerId, scope: 'personal', name, category_id: categoryId, unit, price, image_url: imageUrl || null })
      .select(PRODUCT_SELECT)
      .single(),
    'createProduct'
  );
}
export async function updateProduct(id, patch) {
  return unwrap(await supabase.from('products').update(patch).eq('id', id).select(PRODUCT_SELECT).single(), 'updateProduct');
}
export async function deleteProduct(id) {
  return unwrap(await supabase.from('products').delete().eq('id', id), 'deleteProduct');
}
export async function setProductActive(id, active) {
  return unwrap(await supabase.from('products').update({ active }).eq('id', id).select(PRODUCT_SELECT).single(), 'setProductActive');
}

export async function getProductDeleteImpact(productId) {
  return unwrap(await supabase.rpc('get_product_delete_impact', { p_product_id: productId }), 'getProductDeleteImpact');
}
export async function deleteProductResolved(productId, resolution) {
  return unwrap(
    await supabase.rpc('delete_product_resolved', { p_product_id: productId, p_resolution: resolution || {} }),
    'deleteProductResolved'
  );
}
export async function fetchIngredientRowsForProduct(productId) {
  return unwrap(
    await supabase
      .from('recipe_ingredients')
      .select(`id, recipe_id, quantity, recipe:recipes!recipe_ingredients_recipe_id_fkey(id, name, recipe_code, scope, owner_id)`)
      .eq('product_id', productId),
    'fetchIngredientRowsForProduct'
  );
}

export async function fetchMyRecipes(userId) {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('recipes')
        .select(RECIPE_WITH_CATEGORY_SELECT)
        .eq('owner_id', userId)
        .eq('scope', 'personal')
        .order('name')
        .order('id')
        .range(from, to),
    'fetchMyRecipes'
  );
}

export async function fetchSharedLibrary(userId) {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('recipe_access_grants')
        .select(`granted_at, recipe:recipes!recipe_access_grants_recipe_id_fkey(${RECIPE_WITH_CATEGORY_SELECT})`)
        .eq('grantee_id', userId)
        .is('revoked_at', null)
        .order('granted_at', { ascending: false })
        .order('id')
        .range(from, to),
    'fetchSharedLibrary'
  );
}

export async function fetchRecipeDetail(recipeId) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(RECIPE_DETAIL_WITH_CATEGORY_SELECT)
    .eq('id', recipeId)
    .single();
  if (recipeError) {
    logSupabaseError('fetchRecipeDetail:recipe', recipeError);
    return {
      error: {
        code: recipeError.code,
        message: recipeError.message,
        details: recipeError.details,
        hint: recipeError.hint,
        operation: 'fetchRecipeDetail'
      }
    };
  }
  const [{ data: ingredients, error: ingError }, { data: sections, error: secError }] = await Promise.all([
    supabase.from('recipe_ingredients').select(RECIPE_INGREDIENT_DETAIL_SELECT).eq('recipe_id', recipeId).order('sort_order'),
    supabase.from('recipe_categories').select(RECIPE_SECTION_DETAIL_SELECT).eq('recipe_id', recipeId).order('sort_order')
  ]);
  if (ingError) {
    logSupabaseError('fetchRecipeDetail:ingredients', ingError);
    return {
      error: {
        code: ingError.code,
        message: ingError.message,
        details: ingError.details,
        hint: ingError.hint,
        operation: 'fetchRecipeDetail'
      }
    };
  }
  if (secError) {
    logSupabaseError('fetchRecipeDetail:sections', secError);
    return {
      error: {
        code: secError.code,
        message: secError.message,
        details: secError.details,
        hint: secError.hint,
        operation: 'fetchRecipeDetail'
      }
    };
  }
  return { data: { recipe, ingredients: ingredients || [], sections: sections || [] } };
}

export async function createRecipe(ownerId, fields) {
  return unwrap(
    await supabase
      .from('recipes')
      .insert({
        owner_id: ownerId,
        scope: 'personal',
        status: 'private',
        name: fields.name,
        category_id: fields.categoryId,
        prep_time: fields.prepTime,
        servings: fields.servings,
        difficulty: fields.difficulty,
        image_url: fields.imageUrl || null,
        extras: fields.extras || [],
        instructions: fields.instructions || [],
        tips: fields.tips || []
      })
      .select(RECIPE_SELECT)
      .single(),
    'createRecipe'
  );
}
export async function updateRecipe(id, patch) {
  return unwrap(await supabase.from('recipes').update(patch).eq('id', id).select(RECIPE_SELECT).single(), 'updateRecipe');
}
export async function deleteRecipe(id) {
  return unwrap(await supabase.from('recipes').delete().eq('id', id), 'deleteRecipe');
}

export async function getRecipeDeleteImpact(recipeId) {
  return unwrap(await supabase.rpc('get_recipe_delete_impact', { p_recipe_id: recipeId }), 'getRecipeDeleteImpact');
}
export async function deleteRecipeChecked(recipeId, { revokeShares = false, cancelPendingRequests = false } = {}) {
  return unwrap(
    await supabase.rpc('delete_recipe', {
      p_recipe_id: recipeId,
      p_revoke_shares: revokeShares,
      p_cancel_pending_requests: cancelPendingRequests
    }),
    'deleteRecipeChecked'
  );
}

export async function deleteRecipeAction(recipeId, action, { revokeShares = false, cancelPendingRequests = false } = {}) {
  return unwrap(
    await supabase.rpc('delete_recipe_action', {
      p_recipe_id: recipeId,
      p_action: action,
      p_revoke_shares: revokeShares,
      p_cancel_pending_requests: cancelPendingRequests
    }),
    'deleteRecipeAction'
  );
}

export async function countOtherRecipesUsingProduct(productId, excludeRecipeId) {
  let q = supabase.from('recipe_ingredients').select('recipe_id', { count: 'exact', head: true }).eq('product_id', productId);
  if (excludeRecipeId) q = q.neq('recipe_id', excludeRecipeId);
  const { count, error } = await q;
  if (error) {
    logSupabaseError('countOtherRecipesUsingProduct', error);
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        operation: 'countOtherRecipesUsingProduct'
      }
    };
  }
  return { data: count || 0 };
}

export async function replaceRecipeIngredients(recipeId, rows) {
  const del = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
  if (del.error) {
    logSupabaseError('replaceRecipeIngredients:delete', del.error);
    return {
      error: {
        code: del.error.code,
        message: del.error.message,
        details: del.error.details,
        hint: del.error.hint,
        operation: 'replaceRecipeIngredients'
      }
    };
  }
  if (!rows.length) return { data: [] };
  return unwrap(
    await supabase
      .from('recipe_ingredients')
      .insert(rows.map((row, i) => ({ recipe_id: recipeId, product_id: row.productId, quantity: row.quantity, sort_order: i })))
      .select(),
    'replaceRecipeIngredients:insert'
  );
}
export async function replaceRecipeCategories(recipeId, categoryIds) {
  const del = await supabase.from('recipe_categories').delete().eq('recipe_id', recipeId);
  if (del.error) {
    logSupabaseError('replaceRecipeCategories:delete', del.error);
    return {
      error: {
        code: del.error.code,
        message: del.error.message,
        details: del.error.details,
        hint: del.error.hint,
        operation: 'replaceRecipeCategories'
      }
    };
  }
  if (!categoryIds.length) return { data: [] };
  return unwrap(
    await supabase
      .from('recipe_categories')
      .insert(categoryIds.map((categoryId, i) => ({ recipe_id: recipeId, category_id: categoryId, sort_order: i })))
      .select(),
    'replaceRecipeCategories:insert'
  );
}
export async function fetchProductSections(productId) {
  return unwrap(
    await supabase.from('product_categories').select(PRODUCT_SECTION_DETAIL_SELECT).eq('product_id', productId).order('sort_order'),
    'fetchProductSections'
  );
}
export async function replaceProductCategories(productId, categoryIds) {
  const del = await supabase.from('product_categories').delete().eq('product_id', productId);
  if (del.error) {
    logSupabaseError('replaceProductCategories:delete', del.error);
    return {
      error: {
        code: del.error.code,
        message: del.error.message,
        details: del.error.details,
        hint: del.error.hint,
        operation: 'replaceProductCategories'
      }
    };
  }
  if (!categoryIds.length) return { data: [] };
  return unwrap(
    await supabase
      .from('product_categories')
      .insert(categoryIds.map((categoryId, i) => ({ product_id: productId, category_id: categoryId, sort_order: i })))
      .select(),
    'replaceProductCategories:insert'
  );
}

export async function activateSharing(recipeId) {
  return unwrap(await supabase.rpc('activate_recipe_sharing', { p_recipe_id: recipeId }), 'activateSharing');
}
export async function regenerateShareCode(recipeId) {
  return unwrap(await supabase.rpc('regenerate_recipe_share_code', { p_recipe_id: recipeId }), 'regenerateShareCode');
}
export async function deactivateSharing(recipeId) {
  return unwrap(await supabase.rpc('deactivate_recipe_sharing', { p_recipe_id: recipeId }), 'deactivateSharing');
}
export async function revokeAccess(recipeId, granteeId) {
  return unwrap(await supabase.rpc('revoke_recipe_access', { p_recipe_id: recipeId, p_grantee_id: granteeId || null }), 'revokeAccess');
}
export async function fetchShareStatus(recipeId) {
  const { data, error } = await supabase.from('recipe_shares').select('share_code, active').eq('recipe_id', recipeId).maybeSingle();
  if (error) {
    logSupabaseError('fetchShareStatus', error);
    return { error: { code: error.code, message: error.message, details: error.details, hint: error.hint, operation: 'fetchShareStatus' } };
  }
  return { data };
}
export async function fetchActiveGrantCount(recipeId) {
  const { count, error } = await supabase
    .from('recipe_access_grants')
    .select('id', { count: 'exact', head: true })
    .eq('recipe_id', recipeId)
    .is('revoked_at', null);
  if (error) {
    logSupabaseError('fetchActiveGrantCount', error);
    return {
      error: { code: error.code, message: error.message, details: error.details, hint: error.hint, operation: 'fetchActiveGrantCount' }
    };
  }
  return { data: count || 0 };
}

const SHARE_CODE_GENERIC_ERROR = 'Código inválido. Verifique e tente novamente.';
export async function redeemShareCode(rawCode) {
  const { data, error } = await supabase.rpc('redeem_recipe_share', { p_share_code: String(rawCode || '').trim() });
  if (error) {
    logSupabaseError('redeemShareCode', error);
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('cannot_add_own_recipe')) return { error: { friendly: 'Esta receita já é sua.' } };
    return { error: { friendly: SHARE_CODE_GENERIC_ERROR } };
  }
  return { data };
}

export async function getRecipeAuthorName(recipeId) {
  return unwrap(await supabase.rpc('get_recipe_author_name', { p_recipe_id: recipeId }), 'getRecipeAuthorName');
}

export async function createRecipeCopy(recipeId, resolutions) {
  const { data, error } = await supabase.rpc('create_recipe_copy', { p_recipe_id: recipeId, p_resolutions: resolutions || [] });
  if (error) {
    logSupabaseError('createRecipeCopy', error);
    return { error: { code: error.code, message: error.message, details: error.details, hint: error.hint, operation: 'createRecipeCopy' } };
  }
  return { data };
}

function isForeign(cat, viewerId) {
  return !!cat && cat.scope === 'personal' && cat.owner_id !== viewerId;
}
export function computeForeignReferences(detail, viewerId) {
  const refs = [];
  const seen = new Set();
  const addRef = (refType, refId, label, purpose) => {
    const key = refType + ':' + refId;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ refType, refId, label, purpose });
  };
  const primaryCat = detail.recipe.category;
  if (isForeign(primaryCat, viewerId)) addRef('category', primaryCat.id, primaryCat.name, 'primary');
  (detail.sections || []).forEach((s) => {
    if (isForeign(s.category, viewerId)) addRef('category', s.category.id, s.category.name, 'section');
  });
  (detail.ingredients || []).forEach((ing) => {
    const p = ing.product;
    if (p && p.scope === 'personal' && p.owner_id !== viewerId) addRef('product', p.id, p.name, 'ingredient');
  });
  return refs;
}

export async function fetchMySales() {
  return unwrap(
    await supabase
      .from('sales')
      .select('id, owner_id, sale_date, value, ipc, created_at, updated_at')
      .order('sale_date', { ascending: false }),
    'fetchMySales'
  );
}
export async function createSale(fields) {
  return unwrap(
    await supabase
      .from('sales')
      .insert({
        sale_date: fields.saleDate,
        value: fields.value,
        ipc: fields.ipc || 0
      })
      .select('id, owner_id, sale_date, value, ipc, created_at, updated_at')
      .single(),
    'createSale'
  );
}
export async function updateSale(id, fields) {
  return unwrap(
    await supabase
      .from('sales')
      .update({
        sale_date: fields.saleDate,
        value: fields.value,
        ipc: fields.ipc || 0
      })
      .eq('id', id)
      .select('id, owner_id, sale_date, value, ipc, created_at, updated_at')
      .single(),
    'updateSale'
  );
}
export async function deleteSale(id) {
  return unwrap(await supabase.from('sales').delete().eq('id', id), 'deleteSale');
}

export async function fetchPublicCategories() {
  return unwrap(
    await supabase
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('scope', 'site')
      .eq('active', true)
      .order('sort_order')
      .order('name')
      .order('id'),
    'fetchPublicCategories'
  );
}
export async function fetchPublicProducts() {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('products')
        .select(PRODUCT_WITH_CATEGORY_SELECT)
        .eq('scope', 'site')
        .eq('active', true)
        .order('name')
        .order('id')
        .range(from, to),
    'fetchPublicProducts'
  );
}
export async function fetchPublicRecipes() {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('recipes')
        .select(RECIPE_WITH_CATEGORY_SELECT)
        .eq('scope', 'site')
        .eq('status', 'published')
        .order('name')
        .order('id')
        .range(from, to),
    'fetchPublicRecipes'
  );
}
export async function fetchRecipeIngredientsBulk(recipeIds) {
  if (!recipeIds.length) return { data: [] };
  return unwrap(
    await supabase
      .from('recipe_ingredients')
      .select('recipe_id, product_id, quantity, sort_order')
      .in('recipe_id', recipeIds)
      .order('sort_order'),
    'fetchRecipeIngredientsBulk'
  );
}
export async function fetchRecipeSectionsBulk(recipeIds) {
  if (!recipeIds.length) return { data: [] };
  return unwrap(await supabase.rpc('list_public_recipe_sections', { p_recipe_ids: recipeIds }), 'fetchRecipeSectionsBulk');
}
export async function fetchProductSectionsBulk(productIds) {
  if (!productIds.length) return { data: [] };
  return unwrap(await supabase.rpc('list_public_product_sections', { p_product_ids: productIds }), 'fetchProductSectionsBulk');
}

async function fetchCatalogStructure(publicOnly) {
  const operation = publicOnly ? 'fetchPublicCatalogStructure' : 'fetchAdminCatalogStructure';
  const read = (table, fields, order, activeOnly = false) =>
    fetchAllPages((from, to) => {
      let query = supabase.from(table).select(fields);
      if (activeOnly) query = query.eq('active', true);
      for (const column of order) query = query.order(column);
      return query.range(from, to);
    }, `${operation}:${table}`);
  const [pages, sections, recipes, products] = await Promise.all([
    read('catalog_pages', 'id, key, name, sort_order, active', ['sort_order', 'id'], publicOnly),
    read('catalog_sections', 'id, page_id, name, slug, sort_order, active', ['sort_order', 'id'], publicOnly),
    read('catalog_section_recipes', 'section_id, recipe_id, sort_order', ['sort_order', 'section_id', 'recipe_id']),
    read('catalog_section_products', 'section_id, product_id, sort_order', ['sort_order', 'section_id', 'product_id'])
  ]);
  const error = pages.error || sections.error || recipes.error || products.error;
  return error
    ? { data: null, error }
    : {
        data: { pages: pages.data || [], sections: sections.data || [], recipes: recipes.data || [], products: products.data || [] },
        error: null
      };
}

export async function fetchPublicCatalogStructure() {
  return fetchCatalogStructure(true);
}

export async function fetchAdminCategories() {
  return fetchAllPages(
    (from, to) =>
      supabase.from('categories').select(CATEGORY_SELECT).eq('scope', 'site').order('sort_order').order('name').order('id').range(from, to),
    'fetchAdminCategories'
  );
}
export async function fetchAdminCatalogStructure() {
  return fetchCatalogStructure(false);
}

export async function assignCatalogSectionItem(sectionId, itemId) {
  return unwrap(
    await supabase.rpc('admin_assign_catalog_section_item', { p_section_id: sectionId, p_item_id: itemId }),
    'assignCatalogSectionItem'
  );
}

export async function adminReorderCatalogSections(pageKey, sections) {
  return unwrap(
    await supabase.rpc('admin_reorder_catalog_sections', { p_page_key: pageKey, p_sections: sections }),
    'adminReorderCatalogSections'
  );
}
export async function fetchAdminProducts() {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('products_with_price_freshness')
        .select(ADMIN_PRODUCT_SELECT)
        .eq('scope', 'site')
        .order('name')
        .order('id')
        .range(from, to),
    'fetchAdminProducts'
  );
}
export async function fetchAdminRecipes() {
  return fetchAllPages(
    (from, to) =>
      supabase.from('recipes').select(RECIPE_WITH_CATEGORY_SELECT).eq('scope', 'site').order('name').order('id').range(from, to),
    'fetchAdminRecipes'
  );
}

export async function createSiteCategory({ type, name, active }) {
  return unwrap(
    await supabase
      .from('categories')
      .insert({ scope: 'site', owner_id: null, type, name, active: !!active })
      .select(CATEGORY_SELECT)
      .single(),
    'createSiteCategory'
  );
}
export async function updateSiteCategory(id, patch) {
  return unwrap(await supabase.from('categories').update(patch).eq('id', id).select(CATEGORY_SELECT).single(), 'updateSiteCategory');
}
export async function createSiteProduct({ name, categoryId, unit, price, active, imageUrl }) {
  return unwrap(
    await supabase
      .from('products')
      .insert({ scope: 'site', owner_id: null, name, category_id: categoryId, unit, price, active: !!active, image_url: imageUrl || null })
      .select(PRODUCT_SELECT)
      .single(),
    'createSiteProduct'
  );
}
export async function updateSiteProduct(id, patch) {
  return unwrap(await supabase.from('products').update(patch).eq('id', id).select(PRODUCT_SELECT).single(), 'updateSiteProduct');
}
export async function setProductSwiftSource(id, url) {
  return unwrap(await supabase.rpc('set_product_swift_source', { p_product_id: id, p_url: url || null }), 'setProductSwiftSource');
}
export async function saveSiteProductAtomic(id, fields, sectionIds) {
  return unwrap(
    await supabase.rpc('save_site_product_atomic', {
      p_product_id: id || null,
      p_fields: fields,
      p_section_ids: sectionIds || []
    }),
    'saveSiteProductAtomic'
  );
}
const syncInFlight = new Map();
async function invokeSwiftPriceSync(body) {
  const key = body.productId || 'batch';
  if (syncInFlight.has(key)) return syncInFlight.get(key);
  const operation = (async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      const error = await normalizeSwiftSyncError({
        code: 'session_expired',
        message: sessionError?.message || 'No active Supabase session'
      });
      console.error('[Swift price sync] authentication failed', error.technical);
      return { data: null, error };
    }
    let lastError = null;
    const requestBody = { ...body, requestId: body.requestId || crypto.randomUUID() };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await supabase.functions.invoke('swift-price-sync', { body: requestBody });
        if (!result.error && result.data && Number.isFinite(result.data.products_failed)) {
          if (result.data.products_failed > 0)
            return {
              data: result.data,
              error: {
                code: 'partial_sync',
                message: `Sincronização parcial: ${result.data.products_failed} produto(s) falharam.`,
                runId: result.data.run_id,
                correlationId: result.data.correlation_id,
                metrics: result.data,
                failures: result.data.failures || []
              }
            };
          return { data: result.data, error: null };
        }
        if (!result.error) {
          return { data: result.data, error: { code: 'invalid_sync_response', message: 'O sincronizador retornou métricas inválidas.' } };
        }
        lastError = result.error;
      } catch (error) {
        lastError = error;
      }
      if (attempt === 0) {
        const normalized = await normalizeSwiftSyncError(lastError);
        const receivedHttpResponse = Number.isFinite(lastError?.context?.status);
        if (receivedHttpResponse || !normalized.retryable) break;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
    const error = await normalizeSwiftSyncError(lastError);
    console.error('[Swift price sync] invocation failed', {
      code: error.code,
      status: error.status,
      technicalMessage: error.technical.message,
      providerCode: error.technical.providerCode,
      providerMessage: error.technical.providerMessage
    });
    return { data: null, error };
  })();
  syncInFlight.set(key, operation);
  try {
    return await operation;
  } finally {
    syncInFlight.delete(key);
  }
}
export async function refreshProductPrice(productId) {
  return invokeSwiftPriceSync({ productId });
}
export async function refreshAllProductPrices() {
  return invokeSwiftPriceSync({});
}

export async function createSiteRecipe(fields) {
  return unwrap(
    await supabase
      .from('recipes')
      .insert({
        scope: 'site',
        owner_id: null,
        status: fields.status,
        name: fields.name,
        category_id: fields.categoryId,
        prep_time: fields.prepTime,
        servings: fields.servings,
        difficulty: fields.difficulty,
        image_url: fields.imageUrl || null,
        featured: !!fields.featured,
        extras: fields.extras || [],
        instructions: fields.instructions || [],
        tips: fields.tips || []
      })
      .select(RECIPE_SELECT)
      .single(),
    'createSiteRecipe'
  );
}
export async function updateSiteRecipe(id, patch) {
  return unwrap(await supabase.from('recipes').update(patch).eq('id', id).select(RECIPE_SELECT).single(), 'updateSiteRecipe');
}

export async function checkRecipePublishDependencies(recipeId) {
  return unwrap(await supabase.rpc('check_recipe_publish_dependencies', { p_recipe_id: recipeId }), 'checkRecipePublishDependencies');
}
export async function submitCategoryRequest(sourceId, reason) {
  return unwrap(
    await supabase.rpc('submit_category_request', { p_source_id: sourceId, p_reason: reason || null }),
    'submitCategoryRequest'
  );
}
export async function submitProductRequest(sourceId, reason) {
  return unwrap(await supabase.rpc('submit_product_request', { p_source_id: sourceId, p_reason: reason || null }), 'submitProductRequest');
}
export async function submitRecipeRequest(sourceId, reason) {
  return unwrap(await supabase.rpc('submit_recipe_request', { p_source_id: sourceId, p_reason: reason || null }), 'submitRecipeRequest');
}
export async function resubmitCategoryRequest(requestId, message) {
  return unwrap(
    await supabase.rpc('resubmit_category_request', { p_request_id: requestId, p_message: message || null }),
    'resubmitCategoryRequest'
  );
}
export async function resubmitProductRequest(requestId, message) {
  return unwrap(
    await supabase.rpc('resubmit_product_request', { p_request_id: requestId, p_message: message || null }),
    'resubmitProductRequest'
  );
}
export async function resubmitRecipeRequest(requestId, message) {
  return unwrap(
    await supabase.rpc('resubmit_recipe_request', { p_request_id: requestId, p_message: message || null }),
    'resubmitRecipeRequest'
  );
}
export async function cancelChangeRequest(requestId) {
  return unwrap(await supabase.rpc('cancel_change_request', { p_request_id: requestId }), 'cancelChangeRequest');
}

const REQUEST_SELECT =
  'id, request_code, requester_id, requester_display_name_snapshot, entity_type, action_type, source_id, source_code, target_id, target_code, base_version, current_revision, status, reason, admin_note, created_at, updated_at, submitted_at, reviewed_at, reviewed_by';
export async function fetchMyChangeRequests(userId) {
  return fetchAllPages(
    (from, to) =>
      supabase
        .from('change_requests')
        .select(REQUEST_SELECT)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, to),
    'fetchMyChangeRequests'
  );
}
export async function fetchAllChangeRequests() {
  return fetchAllPages(
    (from, to) =>
      supabase.from('change_requests').select(REQUEST_SELECT).order('created_at', { ascending: false }).order('id').range(from, to),
    'fetchAllChangeRequests'
  );
}
export async function fetchChangeRequestRevisions(requestId) {
  return unwrap(
    await supabase
      .from('change_request_revisions')
      .select('id, revision_number, payload, message, submitted_by, created_at')
      .eq('request_id', requestId)
      .order('revision_number'),
    'fetchChangeRequestRevisions'
  );
}

export async function returnChangeRequest(requestId, adminNote) {
  return unwrap(await supabase.rpc('return_change_request', { p_request_id: requestId, p_admin_note: adminNote }), 'returnChangeRequest');
}
export async function reviewChangeRequest(requestId, decision, adminNote, publishMode) {
  return unwrap(
    await supabase.rpc('review_change_request', {
      p_request_id: requestId,
      p_decision: decision,
      p_admin_note: adminNote || null,
      p_publish_mode: publishMode || 'published'
    }),
    'reviewChangeRequest'
  );
}
export async function findSimilarSiteItems(entityType, name) {
  return unwrap(await supabase.rpc('find_similar_site_items', { p_entity_type: entityType, p_name: name }), 'findSimilarSiteItems');
}

export async function adminImportPublicRecipes(mode, recipes) {
  return unwrap(await supabase.rpc('admin_import_public_recipes', { p_mode: mode, p_recipes: recipes }), 'adminImportPublicRecipes');
}

export async function adminImportPublicCatalog(modes, categories, products, recipes, sections, recipeSections, productSections) {
  return unwrap(
    await supabase.rpc('admin_import_public_catalog', {
      p_modes: modes,
      p_categories: categories,
      p_products: products,
      p_recipes: recipes,
      p_sections: sections,
      p_recipe_section_links: recipeSections,
      p_product_section_links: productSections
    }),
    'adminImportPublicCatalog'
  );
}

export async function adminDeleteAllProductsAndRecipes(password) {
  return unwrap(await supabase.rpc('admin_delete_all_products_and_recipes', { p_password: password }), 'adminDeleteAllProductsAndRecipes');
}

export async function adminDeleteInactiveCatalogItems(password) {
  return unwrap(await supabase.rpc('admin_delete_inactive_catalog_items', { p_password: password }), 'adminDeleteInactiveCatalogItems');
}

export async function adminReorderHomeSections(sections) {
  return unwrap(await supabase.rpc('admin_reorder_home_sections', { p_sections: sections }), 'adminReorderHomeSections');
}
export async function adminReorderRecipeSections(sections) {
  return unwrap(await supabase.rpc('admin_reorder_recipe_sections', { p_sections: sections }), 'adminReorderRecipeSections');
}
export async function adminReorderProductSections(sections) {
  return unwrap(await supabase.rpc('admin_reorder_product_sections', { p_sections: sections }), 'adminReorderProductSections');
}
