import { catalogConfig } from '../../../shared/config/catalog.js';

const PRODUCT_FIELDS =
  'id,product_code,name,category_id,unit,price,image_url,swift_product_url,price_cents,regular_price_cents,promo_price_cents,promo_min_quantity,pricing_type,price_unit,price_status,price_last_success_at,category:categories!products_category_id_fkey(id,name)';
const RECIPE_FIELDS =
  'id,name,category_id,prep_time,servings,difficulty,image_url,instructions,tips,extras,featured,category:categories!recipes_category_id_fkey(id,name)';

// Anonymous REST reads use the existing Yourcipe RLS policies. No schema changes.
export async function readCatalog(table, params, { signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${catalogConfig.url}/rest/v1/${table}?${new URLSearchParams(params)}`, {
      headers: { apikey: catalogConfig.key, Prefer: 'count=exact' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Não foi possível consultar o catálogo. Tente novamente.');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('O catálogo retornou uma resposta inválida.');
    const totalText = response.headers.get('content-range')?.split('/')[1];
    return { rows, total: totalText && totalText !== '*' ? Number(totalText) : null };
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error('A consulta demorou mais que o esperado. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

async function readAll(table, params, options) {
  const rows = [];
  for (;;) {
    const page = await readCatalog(table, { ...params, limit: '200', offset: String(rows.length) }, options);
    rows.push(...page.rows);
    if (!page.rows.length || (page.total !== null && rows.length >= page.total)) return rows;
  }
}

export const catalogRepository = {
  products: (options) =>
    readAll(
      'products',
      {
        select: PRODUCT_FIELDS,
        scope: 'eq.site',
        active: 'eq.true',
        order: 'name.asc,id.asc'
      },
      options
    ),
  categories: (options) =>
    readAll(
      'categories',
      {
        select: 'id,name',
        scope: 'eq.site',
        active: 'eq.true',
        type: 'eq.proteina',
        order: 'sort_order.asc,name.asc,id.asc'
      },
      options
    ),
  recipes: (options) =>
    readAll(
      'recipes',
      {
        select: RECIPE_FIELDS,
        scope: 'eq.site',
        status: 'eq.published',
        order: 'name.asc,id.asc'
      },
      options
    ),
  async relatedRecipes(productId, options) {
    const rows = await readAll(
      'recipe_ingredients',
      {
        select: `recipe:recipes!recipe_ingredients_recipe_id_fkey!inner(${RECIPE_FIELDS})`,
        product_id: `eq.${productId}`,
        'recipe.scope': 'eq.site',
        'recipe.status': 'eq.published',
        order: 'id.asc'
      },
      options
    );
    return [...new Map(rows.filter((row) => row.recipe).map((row) => [row.recipe.id, row.recipe])).values()];
  },
  async recipeIngredients(recipeId, options) {
    return readAll(
      'recipe_ingredients',
      {
        select: `id,quantity,product:products!recipe_ingredients_product_id_fkey(${PRODUCT_FIELDS})`,
        recipe_id: `eq.${recipeId}`,
        order: 'sort_order.asc,id.asc'
      },
      options
    );
  }
};
