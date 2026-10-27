import fs from 'node:fs';
import assert from 'node:assert/strict';
import { recipes, packs } from './recipes-42-data.mjs';
import { parseCatalogWorkbook, normalizeImportText as fold } from '../src/products/insights/creation/admin/importParser.js';

const directory = 'docs/catalog-expansion-2026-10-27';
const source = JSON.parse(fs.readFileSync(`${directory}/source.json`, 'utf8'));
const byName = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
const currentSkus = new Set(source.existing.flatMap((p) => (p.swift_sku ? [p.swift_sku] : [])));
const currentSlugs = new Set(source.existing.flatMap((p) => (p.swift_product_url ? [p.swift_product_url.split('/').at(-1)] : [])));
const currentNames = new Set(source.existing.map((p) => fold(p.name)));
const absent = source.swift.filter((p) => !currentSlugs.has(p.slug) && !p.skus.some((sku) => currentSkus.has(sku)));
const usedNames = new Set(currentNames);
const audit = [];
const products = absent
  .map((p) => {
    const name = usedNames.has(fold(p.name)) ? `${p.name} (SKU ${p.skus[0]})` : p.name;
    usedNames.add(fold(name));
    const unit = /\bde [\d,.]+\s*kg a /i.test(p.name) ? 'kg' : 'pacote';
    audit.push({
      produto_id: p.id,
      nome_original: p.name,
      nome_importacao: name,
      sku: p.skus.join(', '),
      categoria: p.category,
      disponivel_na_consulta: p.available ? 'sim' : 'não',
      motivo: name === p.name ? 'SKU e URL ausentes no EPAVOne' : 'SKU e URL ausentes. Nome já cadastrado. Conferir variante na prévia',
      fonte: p.source,
      swift_url: p.url,
      imagem: p.image
    });
    return { nome: name, categoria: p.category, unidade: unit, imagem: p.image, swift_url: p.url, swift_sku: p.skus[0] };
  })
  .sort(byName);
const productByName = new Map(source.existing.map((p) => [fold(p.name), p]));
const ingredient = (alias, amount) => {
  const [name, mass] = packs[alias];
  const existing = productByName.get(fold(name));
  const fresh = products.find((p) => fold(p.nome) === fold(name));
  assert(existing || fresh, `Missing ingredient ${name}`);
  assert(!existing || existing.unit === 'pacote', `Check quantity unit of ${name}: ${existing?.unit}`);
  return `${existing?.name || fresh.nome}:${Number((amount / mass).toFixed(6))}`;
};
const recipeRows = recipes.map(([nome, categoria, tempo, porcoes, ingredients, extras, steps, tip], index) => {
  assert(!source.existingRecipes.some((r) => fold(r.name) === fold(nome)), `Existing recipe ${nome}`);
  assert(Object.keys(ingredients).length >= 2);
  assert(steps.length >= 4);
  assert(![...extras, ...steps, tip].some((s) => s.includes(';')));
  return {
    nome,
    categoria,
    tempo,
    porcoes,
    dificuldade: [8, 12, 20, 34].includes(index) ? 'Médio' : 'Fácil',
    imagem: '',
    destaque: false,
    ingredientes: Object.entries(ingredients)
      .map(([alias, amount]) => ingredient(alias, amount))
      .join('; '),
    extras: extras.join('; '),
    modoPreparo: steps.join('; '),
    dicas: `${tip}; Quantidades em frações da embalagem indicada, não em kg. O tempo não inclui descongelamento. Descongele na geladeira quando orientado e siga o rótulo para produtos congelados ou pré-cozidos.; Receita autoral sugerida para o EPAVOne, sem teste culinário presencial.`
  };
});
assert.equal(recipeRows.length, 42);
const categories = [...new Set(products.map((p) => p.categoria))].map((nome) => ({ tipo: 'proteina', nome }));
categories.push(...[...new Set(recipeRows.map((p) => p.categoria))].map((nome) => ({ tipo: 'receita', nome })));
const sections = [
  { pagina: 'home', secao: 'Novas ideias para a semana', ordem: 10, ativa: true },
  ...[...new Set(recipeRows.map((r) => r.categoria))].map((c, i) => ({
    pagina: 'recipes',
    secao: `Novas receitas de ${c.toLowerCase()}`,
    ordem: 10 + i,
    ativa: true
  })),
  ...[...new Set(products.map((p) => p.categoria))].map((c, i) => ({ pagina: 'products', secao: c, ordem: 20 + i, ativa: true }))
];
const links = recipeRows.flatMap((r, i) => [
  { pagina: 'home', secao: 'Novas ideias para a semana', receita: r.nome, ordem: i },
  { pagina: 'recipes', secao: `Novas receitas de ${r.categoria.toLowerCase()}`, receita: r.nome, ordem: i }
]);
const context = { products: source.existing, recipes: source.existingRecipes };
const sheets = {
  Produtos: products,
  Receitas: recipeRows,
  Categorias: categories,
  Seções: sections,
  'Receitas por Seção': links,
  'Produtos por Seção': products.map((p, i) => ({ pagina: 'products', secao: p.categoria, produto: p.nome, ordem: i })),
  'Produtos ausentes': audit.sort((a, b) => a.nome_original.localeCompare(b.nome_original, 'pt-BR')),
  'Como importar': [
    { assunto: 'Conteúdo', orientacao: `42 receitas novas e ${products.length} produtos ausentes por SKU/URL. Consulta de 27/10/2026.` },
    {
      assunto: 'Importação',
      orientacao:
        'Administração → Importação → Adicionar novos. Confira prévia, variantes e duplicatas. Preserve originais. As abas Produtos ausentes e Como importar são informativas e ignoradas pelo importador.'
    },
    {
      assunto: 'Privacidade',
      orientacao:
        'Este Excel alimenta o catálogo público via administração. Criados por mim é uma seção privada separada, sem vínculo com a importação pública.'
    },
    {
      assunto: 'Quantidades',
      orientacao:
        'unidade pacote = fração da embalagem. Ex.: 0.5 do Filé de Tilápia 800 g = 400 g. Ovo 0.4 da embalagem de 10 = 4 ovos. Leite de coco 1 da embalagem de 200 ml = 200 ml.'
    },
    {
      assunto: 'Produtos externos',
      orientacao:
        'extras contém somente os complementos não vinculados a produtos deste arquivo. A lista de compras vinculada à receita inclui as bases vendidas na Swift. Não há receita sustentada só em temperos ou manteiga.'
    },
    {
      assunto: 'Cobertura',
      orientacao:
        '996 IDs públicos retornados em duas varreduras idênticas da API oficial. 191 identidades já presentes, 805 ausentes. O site EPAVOne tinha 197 produtos. Produtos regionais, ocultos ou não publicados não são enumeráveis aqui.'
    },
    {
      assunto: 'Variantes',
      orientacao:
        'Nomes já existentes com SKU/URL diferentes recebem sufixo SKU para não mesclar embalagens silenciosamente. Revise a equivalência comercial na prévia.'
    },
    {
      assunto: 'Disponibilidade',
      orientacao:
        'O indicador disponível reflete a oferta pública sem CEP na consulta. Não garante estoque ou entrega na região do EPAV. Não foram importados preços.'
    },
    {
      assunto: 'Imagens',
      orientacao:
        'Produtos usam fotos oficiais. Receitas não recebem fotos de produto nem imagens artificiais. A imagem da receita fica vazia e usa o fallback do site.'
    },
    { assunto: 'Fonte do catálogo', orientacao: source.source },
    {
      assunto: 'Fonte de comparação',
      orientacao:
        'https://github.com/Leo-yTnk/EPAVOne e leitura anônima do catálogo público no Supabase, em 27/10/2026. Metadados por produto estão em Produtos ausentes.'
    },
    {
      assunto: 'Receitas',
      orientacao:
        '42 composições autorais, não copiadas da Swift e sem teste culinário presencial. Tempos estimados sem descongelamento. Respeite rótulos e confira o cozimento.'
    },
    {
      assunto: 'Referência de cocção',
      orientacao:
        'USDA: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart. Aves 74 °C, carnes moídas 71 °C, pescados 63 °C. Cortes inteiros bovinos e suínos 63 °C e 3 minutos de descanso.'
    }
  ]
};
const parsed = parseCatalogWorkbook({ SheetNames: Object.keys(sheets), Sheets: sheets }, context);
assert.deepEqual(parsed.errors, []);
fs.writeFileSync(`${directory}/workbook-data.json`, JSON.stringify(sheets, null, 2) + '\n');
fs.writeFileSync(
  `${directory}/summary.json`,
  JSON.stringify(
    {
      date: source.date,
      swiftProducts: source.swift.length,
      existingProducts: source.existing.length,
      matchedIdentities: source.swift.length - absent.length,
      missingProducts: products.length,
      recipes: recipeRows.length,
      variants: audit.filter((r) => r.nome_importacao !== r.nome_original).length,
      recipeCategories: [...new Set(recipeRows.map((r) => r.categoria))],
      parserErrors: parsed.errors
    },
    null,
    2
  ) + '\n'
);
process.stdout.write(
  JSON.stringify({
    products: products.length,
    recipes: recipeRows.length,
    variants: audit.filter((r) => r.nome_importacao !== r.nome_original).length
  }) + '\n'
);
