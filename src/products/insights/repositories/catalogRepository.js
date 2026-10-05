import { supabaseClient } from '../../../shared/services/supabaseClient.js';

const PRODUCT_FIELDS =
  'id,product_code,name,category_id,unit,price,image_url,swift_product_url,price_cents,regular_price_cents,promo_price_cents,promo_min_quantity,pricing_type,price_unit,price_status,price_last_success_at,category:categories!products_category_id_fkey(id,name)';
const RECIPE_FIELDS =
  'id,name,category_id,prep_time,servings,difficulty,image_url,instructions,tips,extras,featured,category:categories!recipes_category_id_fkey(id,name)';

// Public reads deliberately remain anonymous, including after account migration.
export async function readCatalog(table, params, options) {
  return supabaseClient.readRows(table, params, options);
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
  async structure(options) {
    const [pages, sections, recipes, products] = await Promise.all([
      readAll('catalog_pages', { select: 'id,key,name,sort_order,active', active: 'eq.true', order: 'sort_order.asc,id.asc' }, options),
      readAll(
        'catalog_sections',
        { select: 'id,page_id,name,slug,sort_order,active', active: 'eq.true', order: 'sort_order.asc,id.asc' },
        options
      ),
      readAll(
        'catalog_section_recipes',
        { select: 'section_id,recipe_id,sort_order', order: 'sort_order.asc,section_id.asc,recipe_id.asc' },
        options
      ),
      readAll(
        'catalog_section_products',
        { select: 'section_id,product_id,sort_order', order: 'sort_order.asc,section_id.asc,product_id.asc' },
        options
      )
    ]);
    return { pages, sections, recipes, products };
  },
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
