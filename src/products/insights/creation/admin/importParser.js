import { parseCatalogSectionLinkRow } from './importContract.js';
const DIFICULDADES = ['Fácil', 'Médio', 'Difícil'];
export const normalizeImportText = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const normalizeImportSlug = (value) =>
  normalizeImportText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const splitImportList = (value) =>
  String(value ?? '')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean);
export function parseCatalogWorkbook(wb, context = {}) {
  const nk = (x) => normalizeImportText(x).replace(/[^a-z0-9]+/g, '');
  const get = (row, names) => {
    const m = Object.fromEntries(Object.keys(row).map((k) => [nk(k), row[k]]));
    return names.map((n) => m[nk(n)]).find((v) => v !== undefined) ?? '';
  };
  const rows = (name) => {
    const found = wb.SheetNames.find((n) => normalizeImportText(n) === normalizeImportText(name));
    return found ? wb.Sheets[found] : [];
  };
  const required = ['Categorias', 'Produtos', 'Receitas', 'Seções', 'Receitas por Seção', 'Produtos por Seção'];
  const missing = required.filter((x) => !wb.SheetNames.some((n) => normalizeImportText(n) === normalizeImportText(x)));
  const errors = missing.length ? [`Abas obrigatórias ausentes: ${missing.join(', ')}.`] : [],
    warnings = [];
  const cr = rows('Categorias'),
    pr = rows('Produtos'),
    rr = rows('Receitas'),
    sr = rows('Seções'),
    rsr = rows('Receitas por Seção'),
    psr = rows('Produtos por Seção');
  if (cr.length + pr.length + rr.length + sr.length + rsr.length + psr.length > 5000)
    errors.push('A planilha excede o limite seguro de 5.000 linhas.');
  const categories = [],
    products = [],
    recipes = [],
    sections = [],
    recipeSections = [],
    productSections = [];
  const categoryKeys = new Set(
    (context.categories || [])
      .filter((x) => x.active !== false && ['receita', 'proteina'].includes(x.type))
      .map((x) => `${x.type}:${normalizeImportSlug(x.name)}`)
  );
  const seenCat = new Set();
  cr.forEach((row, i) => {
    const line = i + 2,
      type = normalizeImportText(get(row, ['tipo'])),
      name = String(get(row, ['nome'])).trim(),
      key = `${type}:${normalizeImportSlug(name)}`;
    if (!['receita', 'proteina'].includes(type))
      errors.push(
        `Categorias, linha ${line} ("${name || 'sem nome'}"): tipo inválido "${type}"; use somente receita ou proteina. O formato legado secao_* não é suportado.`
      );
    if (!name) errors.push(`Categorias, linha ${line}: campo nome ausente.`);
    if (seenCat.has(key)) errors.push(`Categorias, linha ${line} ("${name}"): categoria duplicada.`);
    else {
      seenCat.add(key);
      categoryKeys.add(key);
      categories.push({ type, name, source_line: line });
    }
  });
  const productNames = new Set((context.products || []).filter((x) => x.active !== false).map((x) => normalizeImportText(x.name))),
    seenProducts = new Set(),
    seenSwiftUrls = new Set(),
    seenSwiftSkus = new Set();
  pr.forEach((row, i) => {
    const line = i + 2,
      name = String(get(row, ['nome'])).trim(),
      key = normalizeImportText(name),
      existing = (context.products || []).find((x) => normalizeImportText(x.name) === key),
      category = String(get(row, ['categoria']) || existing?.category?.name || '').trim(),
      unit = normalizeImportText(get(row, ['unidade']) || existing?.unit),
      image = String(get(row, ['imagem']) || existing?.image_url || '').trim(),
      swift = String(get(row, ['swift_url']) || existing?.swift_product_url || '').trim(),
      sku = String(get(row, ['swift_sku']) || existing?.swift_sku || '').trim();
    if (!name) errors.push(`Produtos, linha ${line}: campo nome ausente.`);
    if (seenProducts.has(key)) errors.push(`Produtos, linha ${line} ("${name}"): produto duplicado.`);
    seenProducts.add(key);
    if (!categoryKeys.has(`proteina:${normalizeImportSlug(category)}`))
      errors.push(`Produtos, linha ${line} ("${name}"): categoria inexistente "${category}".`);
    if (!['kg', 'un', 'pacote', 'caixa', 'pote'].includes(unit)) errors.push(`Produtos, linha ${line} ("${name}"): unidade inválida.`);
    if (!/^https?:\/\/\S+$/i.test(image)) errors.push(`Produtos, linha ${line} ("${name}"): URL de imagem ausente ou inválida.`);
    if (!existing && !/^https:\/\/(www\.)?swift\.com\.br\/[^?#]+$/i.test(swift))
      errors.push(`Produtos, linha ${line} ("${name}"): swift_url obrigatória ou inválida.`);
    if (swift && seenSwiftUrls.has(swift.toLowerCase())) errors.push(`Produtos, linha ${line}: swift_url duplicada.`);
    seenSwiftUrls.add(swift.toLowerCase());
    if (sku && seenSwiftSkus.has(sku.toLowerCase())) errors.push(`Produtos, linha ${line}: swift_sku duplicado.`);
    if (sku) seenSwiftSkus.add(sku.toLowerCase());
    products.push({
      name,
      category,
      unit,
      price: null,
      image_url: image,
      swift_product_url: swift || null,
      swift_sku: sku || null,
      source_line: line
    });
    productNames.add(key);
  });
  const recipeNames = new Set((context.recipes || []).map((x) => normalizeImportText(x.name))),
    seenRecipes = new Set();
  rr.forEach((row, i) => {
    const line = i + 2,
      name = String(get(row, ['nome'])).trim(),
      key = normalizeImportText(name),
      category = String(get(row, ['categoria'])).trim(),
      ingredients = [];
    if (Object.keys(row).some((k) => nk(k) === 'tags') && String(get(row, ['tags'])).trim())
      errors.push(`Receitas, linha ${line} ("${name}"): a coluna tags não posiciona conteúdo; use destaque e a aba Receitas por Seção.`);
    if (!name) errors.push(`Receitas, linha ${line}: campo nome ausente.`);
    if (seenRecipes.has(key)) errors.push(`Receitas, linha ${line} ("${name}"): receita duplicada.`);
    seenRecipes.add(key);
    if (!categoryKeys.has(`receita:${normalizeImportSlug(category)}`))
      errors.push(`Receitas, linha ${line} ("${name}"): categoria inexistente "${category}".`);
    splitImportList(get(row, ['ingredientes'])).forEach((part) => {
      const pos = part.lastIndexOf(':'),
        product = part.slice(0, pos).trim(),
        quantity = Number(part.slice(pos + 1).replace(',', '.'));
      if (pos < 0 || !productNames.has(normalizeImportText(product)))
        errors.push(`Receitas, linha ${line} ("${name}"): produto inexistente "${product || part}".`);
      if (!(quantity > 0)) errors.push(`Receitas, linha ${line} ("${name}"): quantidade inválida para "${product}".`);
      ingredients.push({ product, quantity });
    });
    const prep = Number(get(row, ['tempo'])),
      servings = Number(get(row, ['porcoes', 'porções'])),
      difficulty = String(get(row, ['dificuldade']) || 'Fácil').trim(),
      instructions = splitImportList(get(row, ['modoPreparo', 'modo de preparo']));
    if (!ingredients.length) errors.push(`Receitas, linha ${line} ("${name}"): ingredientes ausentes.`);
    if (!Number.isInteger(prep) || prep < 0) errors.push(`Receitas, linha ${line} ("${name}"): tempo inválido.`);
    if (!Number.isInteger(servings) || servings < 1) errors.push(`Receitas, linha ${line} ("${name}"): porções inválidas.`);
    if (!DIFICULDADES.includes(difficulty)) errors.push(`Receitas, linha ${line} ("${name}"): dificuldade inválida.`);
    if (!instructions.length) errors.push(`Receitas, linha ${line} ("${name}"): modo de preparo ausente.`);
    recipes.push({
      name,
      category,
      prep_time: prep,
      servings,
      difficulty,
      image_url: String(get(row, ['imagem'])).trim(),
      featured: ['true', 'sim', '1'].includes(normalizeImportText(get(row, ['destaque']))),
      ingredients,
      sections: [],
      extras: splitImportList(get(row, ['extras'])),
      instructions,
      tips: splitImportList(get(row, ['dicas'])),
      source_line: line
    });
    recipeNames.add(key);
  });
  const existingSections = new Set();
  const structure = context.structure || { pages: [], sections: [] };
  for (const sec of structure.sections || []) {
    const page = (structure.pages || []).find((p) => p.id === sec.page_id);
    if (page) existingSections.add(`${page.key}:${sec.slug || normalizeImportSlug(sec.name)}`);
  }
  const declared = new Set(),
    validPages = new Set(['home', 'recipes', 'products']);
  sr.forEach((row, i) => {
    const line = i + 2,
      page = normalizeImportText(get(row, ['pagina'])),
      name = String(get(row, ['secao', 'seção'])).trim(),
      slug = normalizeImportSlug(name),
      order = Number(get(row, ['ordem'])),
      rawActive = normalizeImportText(get(row, ['ativa']));
    if (!validPages.has(page)) errors.push(`Seções, linha ${line} ("${name || 'sem seção'}"): página inválida "${page}".`);
    if (!name) errors.push(`Seções, linha ${line}: nome da seção ausente.`);
    if (!Number.isInteger(order) || order < 0) errors.push(`Seções, linha ${line} ("${name}"): ordem inválida.`);
    if (!['true', 'false', 'sim', 'nao', 'não', '1', '0'].includes(rawActive))
      errors.push(`Seções, linha ${line} ("${name}"): ativa deve ser sim/não ou true/false.`);
    const key = `${page}:${slug}`;
    if (declared.has(key)) errors.push(`Seções, linha ${line} ("${name}"): seção duplicada na página ${page}.`);
    declared.add(key);
    sections.push({ page, name, slug, sort_order: order, active: ['true', 'sim', '1'].includes(rawActive), source_line: line });
  });
  const validateLinks = (data, kind, out) => {
    const seen = new Set();
    data.forEach((row, i) => {
      const line = i + 2,
        link = parseCatalogSectionLinkRow(row, kind, { get, normalizeText: normalizeImportText }, line),
        { page, section, sort_order: order } = link,
        item = link[kind === 'receita' ? 'recipe' : 'product'],
        key = `${page}:${normalizeImportSlug(section)}:${normalizeImportText(item)}`;
      if (!validPages.has(page))
        errors.push(`${kind === 'receita' ? 'Receitas' : 'Produtos'} por Seção, linha ${line} ("${item}"): página inválida "${page}".`);
      if (kind === 'receita' && page === 'products')
        errors.push(`Receitas por Seção, linha ${line} ("${item}"): receitas não podem ser vinculadas à página products.`);
      if (kind === 'produto' && page !== 'products')
        errors.push(`Produtos por Seção, linha ${line} ("${item}"): produtos não podem ser vinculados à página ${page}.`);
      if (!declared.has(`${page}:${normalizeImportSlug(section)}`) && !existingSections.has(`${page}:${normalizeImportSlug(section)}`))
        errors.push(
          `${kind === 'receita' ? 'Receitas' : 'Produtos'} por Seção, linha ${line} ("${item}"): seção inexistente "${section}" na página ${page}.`
        );
      const names = kind === 'receita' ? recipeNames : productNames;
      if (!names.has(normalizeImportText(item)))
        errors.push(`${kind === 'receita' ? 'Receitas' : 'Produtos'} por Seção, linha ${line}: ${kind} inexistente "${item}".`);
      if (!Number.isInteger(order) || order < 0)
        errors.push(`${kind === 'receita' ? 'Receitas' : 'Produtos'} por Seção, linha ${line} ("${item}"): ordem inválida.`);
      if (seen.has(key))
        errors.push(`${kind === 'receita' ? 'Receitas' : 'Produtos'} por Seção, linha ${line} ("${item}"): vínculo duplicado.`);
      seen.add(key);
      out.push(link);
    });
  };
  validateLinks(rsr, 'receita', recipeSections);
  validateLinks(psr, 'produto', productSections);
  if (!cr.length && !pr.length && !rr.length && !sr.length && !rsr.length && !psr.length) errors.push('Arquivo sem dados nas seis abas.');

  return { categories, products, recipes, sections, recipeSections, productSections, errors, warnings };
}
