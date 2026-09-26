# EPAVOne Architecture

## Objetivo

Evitar que o EPAVOne repita a evolução monolítica do Yourcipe. A arquitetura separa aplicação, design system, produtos, compartilhados e ferramentas de desenvolvimento.

## Boundaries

### `src/app`

Somente responsabilidades globais:

- bootstrap;
- AppShell;
- router;
- theme;
- providers futuros.

Não contém lógica de negócio do Insights, Planner ou Writer.

### `src/design-system`

Somente componentes e estilos reutilizáveis.

- componente visual público: um arquivo;
- tokens e CSS por família;
- nenhuma dependência de produto;
- Card sempre stitched.

### `src/products/<produto>`

Cada produto é uma feature boundary.

Estrutura recomendada:

```
products/insights/
├── pages/
├── components/
├── services/
├── models/
├── hooks/
└── tests/
```

Um produto não importa internals de outro produto.

### `src/shared`

Código genuinamente compartilhado:

- serviços base;
- erros;
- utilitários;
- constantes;
- tipos/modelos cross-product.

Não mover algo para shared apenas para contornar boundary.

### `src/dev`

Ferramentas de desenvolvimento que não fazem parte do fluxo normal do usuário, como Component Lab.

## Fluxo de dados

```
Page / component
      ↓
feature service
      ↓
repository / adapter
      ↓
API / Supabase
```

UI não chama Supabase ou fetch diretamente.

## Estado

- local: dialog, input, tab, hover;
- feature: filtros, seleção e dados do produto;
- global: sessão, usuário, tema e produto atual.

Não criar um store global para estado local de feature.

## CSS

```
design-system/styles/
├── tokens.css
├── base.css
├── layout.css
├── actions.css
├── forms.css
├── navigation.css
├── data.css
├── feedback.css
└── index.css
```

CSS específico de produto fica ao lado do produto.

Proibidos:

- `transition: all`;
- `!important`;
- `yc-*`;
- aparência de componente duplicada em página;
- inline styles, exceto CSS custom properties alimentadas por dados.

## Cards

Todo card é stitched.

O componente `Card` aplica o contrato automaticamente e componentes derivados compõem `Card`. Páginas não devem criar card manual por CSS.

## Quality gate

Todo PR deve passar:

1. ESLint;
2. architecture checker;
3. Vitest;
4. Vite build.

`npm run verify` executa a mesma sequência localmente.

## Agentes

`AGENTS.md` é obrigatório para agentes de código e resume as regras que não podem ser violadas.
