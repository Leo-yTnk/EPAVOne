# EPAVOne

Portal do EPAV para **EPAVInsights**, **EPAVPlanner** e **EPAVWriter**.

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
#/dev/components
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

O laboratório de componentes fica em **`#/dev/components`**.

## Documentação

- `ARCHITECTURE.md` — boundaries e fluxo técnico.
- `DESIGN-SYSTEM-V1.md` — decisões visuais e regras de interface.
- `COMPONENT-CATALOG.md` — componentes públicos.
- `AGENTS.md` — regras para Codex/Claude/agentes.
