export const templateSheets = {
  Produtos: [
    {
      nome: 'Picanha',
      categoria: 'Bovinos',
      unidade: 'kg',
      imagem: 'https://picsum.photos/seed/picanha/900/650',
      swift_url: 'https://www.swift.com.br/picanha-exemplo',
      swift_sku: 'SWIFT-EXEMPLO-001'
    },
    {
      nome: 'Sal Grosso',
      categoria: 'Mercearia',
      unidade: 'pacote',
      imagem: 'https://picsum.photos/seed/sal/900/650',
      swift_url: 'https://www.swift.com.br/sal-exemplo',
      swift_sku: 'SWIFT-EXEMPLO-002'
    }
  ],
  Receitas: [
    {
      nome: 'Picanha na Brasa',
      categoria: 'Bovina',
      tempo: 50,
      porcoes: 6,
      dificuldade: 'Fácil',
      imagem: 'https://picsum.photos/seed/exemplo/900/650',
      destaque: true,
      ingredientes: 'Picanha:1.5; Sal Grosso:0.2',
      extras: 'Carvão; Pimenta',
      modoPreparo: 'Tempere a carne.; Grelhe até o ponto desejado.',
      dicas: 'Não fure a carne.'
    }
  ],
  Categorias: [
    { tipo: 'proteina', nome: 'Bovinos' },
    { tipo: 'proteina', nome: 'Mercearia' },
    { tipo: 'receita', nome: 'Bovina' }
  ],
  Seções: [
    { pagina: 'home', secao: 'Destaques da Semana', ordem: 0, ativa: true },
    { pagina: 'home', secao: 'Direto da Churrasqueira', ordem: 1, ativa: true },
    { pagina: 'recipes', secao: 'Receitas na Brasa', ordem: 0, ativa: true },
    { pagina: 'products', secao: 'Carnes Bovinas', ordem: 0, ativa: true }
  ],
  'Receitas por Seção': [
    { pagina: 'home', secao: 'Destaques da Semana', receita: 'Picanha na Brasa', ordem: 0 },
    { pagina: 'home', secao: 'Direto da Churrasqueira', receita: 'Picanha na Brasa', ordem: 0 },
    { pagina: 'recipes', secao: 'Receitas na Brasa', receita: 'Picanha na Brasa', ordem: 0 }
  ],
  'Produtos por Seção': [{ pagina: 'products', secao: 'Carnes Bovinas', produto: 'Picanha', ordem: 0 }]
};
