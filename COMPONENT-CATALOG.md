# EPAVOne — Component Catalog

Os componentes React-compatible são implementados em **Preact/JSX**, um por arquivo público em `src/design-system/components/`.

## Fundação

| Componente | Arquivo |
|---|---|
| Text | `Text.jsx` |
| Heading | `Heading.jsx` |
| Icon | `Icon.jsx` |
| Link | `Link.jsx` |
| Stack | `Stack.jsx` |
| Inline | `Inline.jsx` |
| Container | `Container.jsx` |
| Grid | `Grid.jsx` |
| Divider | `Divider.jsx` |

## Interação

| Componente | Estados / variantes |
|---|---|
| Button | primary, secondary, ghost, danger; sm/md/lg; loading/disabled |
| IconButton | sm/md/lg; hover/focus/disabled |
| Input | helper, error, success, disabled |
| NativeSelect | select nativo estilizado |
| Select + Option | open, selected, disabled, keyboard |
| Checkbox | checked/focus/disabled |
| Radio | checked/focus/disabled |
| Switch | checked/focus/disabled |
| Slider | progress/focus/disabled |
| Tabs | active/disabled + teclado |

## Navegação e estrutura

- Nav
- NavItem
- Breadcrumb
- Sidebar
- PageHeader
- Toolbar
- FilterBar / FilterControl
- DateRange

## Data display

- **Card — sempre stitched**
- Badge
- Tag
- MetricCard — compõe Card
- DataTable — compõe Card
- ChartContainer — compõe Card

## Feedback

- Spinner
- Skeleton
- Alert
- EmptyState
- ErrorState
- Dialog — stitched
- Drawer — stitched
- Toast / ToastRegion
- Tooltip

## Keyboard contract

- Tabs: Arrow Left/Right, Home e End.
- Select: teclado nativo do trigger + opções acessíveis.
- Dialog: Escape e focus trap.
- Drawer: Escape; foco retorna ao elemento anterior.
- Tooltip: hover e focus-within.
- Controles nativos preservam comportamento nativo.

## Card contract

Não existe variante de Card sem stitched no design system v1.

```jsx
<Card>...</Card>
```

O checker arquitetural bloqueia uso direto de `className="ds-card"` fora de `Card.jsx`.

## Component Lab

Todos os componentes principais podem ser inspecionados em:

```
#/dev/components
```
