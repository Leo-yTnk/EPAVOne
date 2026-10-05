export const entities = {
  recipes: { label: 'Receitas', singular: 'receita', icon: 'recipe' },
  products: { label: 'Produtos', singular: 'produto', icon: 'product' },
  categories: { label: 'Categorias', singular: 'categoria', icon: 'category' }
};
export const categoryTypes = [
  ['receita', 'Categoria de receita'],
  ['proteina', 'Categoria de produto'],
  ['secao_home', 'Seção da home'],
  ['secao_receita', 'Seção de receitas'],
  ['secao_produto', 'Seção de produtos'],
  ['secao', 'Seção legada']
].map(([value, label]) => ({ value, label }));
export const statusLabels = {
  private: 'Privada',
  draft: 'Rascunho',
  published: 'Publicada',
  archived: 'Arquivada',
  submitted: 'Enviada',
  resubmitted: 'Reenviada',
  changes_requested: 'Ajustes solicitados',
  approved: 'Aprovada',
  rejected: 'Recusada',
  cancelled: 'Cancelada'
};
export function editorValues(item = {}, detail = {}) {
  return {
    name: item.name || '',
    categoryId: item.category_id || '',
    type: item.type || 'receita',
    unit: item.unit || 'un',
    price: item.price ?? '',
    imageUrl: item.image_url || '',
    swiftUrl: item.swift_product_url || '',
    prepTime: item.prep_time ?? 30,
    servings: item.servings ?? 4,
    difficulty: item.difficulty || 'Fácil',
    status: item.status || 'draft',
    active: item.active !== false,
    featured: Boolean(item.featured),
    instructions: (item.instructions || []).join('\n'),
    extras: (item.extras || []).join('\n'),
    tips: (item.tips || []).join('\n'),
    ingredients: (detail.ingredients || []).map((x) => ({ productId: x.product_id, quantity: x.quantity })),
    sections: (detail.sections || []).map((x) => x.category_id)
  };
}
export function validateEditor(type, values) {
  if (!values.name.trim() || values.name.trim().length > 120) return 'Informe um nome com até 120 caracteres.';
  for (const url of [values.imageUrl, values.swiftUrl]) {
    if (url && (url.length > 2048 || !/^https?:\/\/[^\s]+$/i.test(url))) return 'Informe um endereço HTTP ou HTTPS válido.';
  }
  if (type !== 'categories' && !values.categoryId) return 'Escolha uma categoria.';
  if (type === 'products' && (values.price === '' || !Number.isFinite(Number(values.price)) || Number(values.price) < 0))
    return 'Informe um preço válido, igual ou maior que zero.';
  if (type === 'recipes') {
    if (
      !Number.isInteger(Number(values.prepTime)) ||
      Number(values.prepTime) < 0 ||
      !Number.isInteger(Number(values.servings)) ||
      Number(values.servings) < 1
    )
      return 'Confira o tempo de preparo e as porções.';
    if (values.ingredients.some((x) => !x.productId || !Number.isFinite(Number(x.quantity)) || Number(x.quantity) <= 0))
      return 'Escolha o produto e uma quantidade positiva para cada ingrediente.';
    if (new Set(values.ingredients.map((x) => x.productId)).size !== values.ingredients.length)
      return 'Reúna os ingredientes repetidos em uma única linha.';
  }
  return '';
}
export const lines = (value) =>
  String(value || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
