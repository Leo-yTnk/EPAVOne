# EPAVOne

Portal do EPAV para **EPAVInsights**, **EPAVPlanner** e **EPAVWriter**.

## Espaço de trabalho

As abas **One**, **Insights**, **Planner** e **Writer** separam os apps da navegação entre páginas. Insights e Planner usam a mesma barra de navegação de páginas na segunda linha do header, com as áreas de cada produto. Ao alternar apps, cada aba volta à última rota visitada durante a sessão.

O Writer conserva o formulário carregado, dados do cliente, carrinho e etapa enquanto o usuário consulta outro app. Essa continuidade é em memória: recarregar ou fechar a página inicia uma nova sessão. As abas suportam setas, Home e End; as rotas em hash continuam funcionando com links diretos e histórico do navegador.

## EPAVPlanner

O Planner reúne Visão geral, Semana, Clientes, Oportunidades e Desempenho, com preparação e Modo Atendimento. A primeira versão usa dados demonstrativos salvos neste navegador; não altera a carteira ou vendas do banco. Sugestões respeitam as restrições cadastradas e abrem a busca do Insights com retorno ao contexto. O Writer associa o cliente explicitamente ao cadastro do Excel; exportar um formulário não registra compra.

Fluxos, prioridade e limites: [especificação](docs/planner-spec.md), [modelo de dados](docs/planner-data-model.md) e [revisão com evidências](docs/planner-implementation-review.md).

## Stack

- Preact + JSX
- Vite
- CSS modular do design system
- Vitest + Testing Library
- ESLint + Prettier
- GitHub Actions

## Executar

```bash
npm install
npm run dev
```

Validação completa:

```bash
npm run verify
```

## Estrutura

```
src/
├── app/                 # shell, router, theme e bootstrap
├── design-system/
│   ├── components/      # um componente público por arquivo
│   └── styles/          # tokens, base e famílias de componentes
├── products/
│   ├── home/
│   ├── insights/
│   ├── planner/
│   └── writer/
├── shared/              # erros, serviços e utilitários cross-product
└── dev/
    └── component-lab/   # laboratório, fora da home de produção
```

As rotas continuam em hash para suportar hospedagem estática:

```
#/insights/clientes/123/historico
#/planner
#/writer
#/settings
```

## Regras importantes

- Produto não importa internals de outro produto.
- UI de produto não acessa Supabase ou `fetch` diretamente; usa services.
- Não criar source code de aplicação na raiz.
- Não usar `transition: all`, `!important` ou prefixo `yc-*`.
- Inline style só é permitido para CSS custom properties derivadas de dados.
- **Todo Card é stitched por padrão.** Use o componente `Card`; não crie uma superfície de card manual.
- Componentes compartilhados entram em `src/design-system` ou `src/shared`, nunca dentro de outro produto.

As regras são verificadas por `scripts/check-architecture.mjs` e pelo workflow de CI.

## Design system

A fonte canônica do DS está em:

- `src/design-system/components/`
- `src/design-system/styles/`
- `DESIGN-SYSTEM-V1.md`
- `COMPONENT-CATALOG.md`

O laboratório de componentes fica em `src/dev/component-lab/ComponentLab.jsx`, como referência de desenvolvimento sem rota ou importação na aplicação.

## Documentação

- `ARCHITECTURE.md` — boundaries e fluxo técnico.
- `DESIGN-SYSTEM-V1.md` — decisões visuais e regras de interface.
- `COMPONENT-CATALOG.md` — componentes públicos.
- `AGENTS.md` — regras para Codex/Claude/agentes.
