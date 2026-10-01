# EPAVOne Architecture

## Objetivo

Evitar que o EPAVOne repita a evolução monolítica do Yourcipe.

## Boundaries

### `src/app`

- bootstrap;
- AppShell;
- router;
- theme;
- motion de navegação;
- providers futuros.

### `src/design-system`

- componentes reutilizáveis;
- behaviors compartilhados;
- portal/layers;
- tokens;
- styles por família.

Um componente público deve ter um arquivo próprio.

### `src/products/<produto>`

Feature boundary de cada produto.

Um produto não importa internals de outro produto.

### `src/shared`

Somente código genuinamente cross-product.

### `src/dev`

Ferramentas de desenvolvimento, como Component Lab.

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

UI não chama Supabase nem fetch diretamente.

## Estado

- local: dialog, input, tab, menu;
- feature: filtros e dados do produto;
- global: sessão, usuário, tema e produto atual.

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
├── layers.css
└── index.css
```

## Layer architecture

Floating UI não depende do DOM local.

```
trigger
  ↓
useAnchoredLayer
  ↓
Portal(document.body)
  ↓
Select / Menu / Tooltip layer
```

Modal UI:

```
Dialog / Drawer
  ↓
Portal
  ↓
useModalLayer
  ├── focus trap
  ├── Escape
  ├── return focus
  └── body scroll lock
```

## Motion architecture

- deslocamento CSS curto, sem capturar ou dissolver a página inteira;
- fallback CSS quando não;
- tokens únicos de duração/easing/distância;
- reduced motion obrigatório;
- animação nunca substitui feedback funcional.

## Radius architecture

Containers que possuem elementos próximos às bordas devem declarar:

```css
--container-radius
--container-padding
--nested-radius
```

O nested radius deriva de outer radius - padding.

## Cards

Todo Card é stitched.

## Quality gate

Todo PR passa por:

1. ESLint;
2. architecture checker;
3. Vitest;
4. Vite build.

O checker valida também:
- ausência de Select nativo;
- uso de componentes em páginas;
- portal em floating/overlay feedback;
- motion contract;
- compact line-height;
- stitched Card;
- boundaries entre produtos.
