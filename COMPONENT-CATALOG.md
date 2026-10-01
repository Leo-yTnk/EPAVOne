# EPAVOne — Component Catalog

Os componentes públicos são Preact/JSX e vivem individualmente em `src/design-system/components/`.

## Fundação

| Componente | Responsabilidade |
|---|---|
| Text | corpo tipográfico |
| Heading | heading/display |
| Icon | ícone vetorial |
| Link | link textual |
| Stack | layout vertical |
| Inline | layout horizontal |
| Container | largura máxima |
| Grid | grid |
| Divider | separação |

## Interação

| Componente | Contrato |
|---|---|
| Button | primary/secondary/ghost/danger, tamanhos, loading e disabled |
| IconButton | ação compacta acessível |
| Input | label/helper/error/success |
| FileInput | botão de seleção, nome do arquivo, loading e nova seleção do mesmo arquivo |
| Textarea | campo multilinha padronizado |
| Select | **único Select público**, portal, teclado e anchored layer; busca opcional dentro do menu |
| Option | option do Select |
| Checkbox | checked/focus/disabled |
| Radio | checked/focus/disabled |
| Switch | checked/focus/disabled |
| Slider | progress/focus/disabled |
| Tabs | active/disabled + Arrow/Home/End |
| Menu | anchored layer em portal |
| Pagination | anterior/próxima + status |

## Navegação e estrutura

- Nav;
- NavItem;
- Breadcrumb;
- Sidebar;
- PageHeader;
- Toolbar;
- FilterBar;
- FilterControl;
- DateRange.

## Dados

- **Card — sempre stitched**;
- Badge;
- Tag;
- MetricCard;
- DataTable;
- ChartContainer;
- Progress.

## Feedback

- Spinner;
- Skeleton;
- Alert;
- EmptyState;
- ErrorState;
- Dialog;
- Drawer;
- Toast / ToastRegion;
- Tooltip.

## Portal contract

Select, Menu, Tooltip, Dialog, Drawer e Toast são renderizados fora da árvore visual da página por `Portal`.

Isso é obrigatório para evitar clipping e stacking bugs.

## Select contract

Não existe `NativeSelect`.

O Select canônico:
- abre acima/abaixo conforme viewport;
- acompanha scroll/resize;
- nasce do trigger;
- não é cortado por Card com overflow;
- separa highlight de selected;
- suporta teclado completo.

## Feedback contract

Uma ação visualmente habilitada deve produzir comportamento ou feedback.

- EmptyState não mostra CTA sem callback;
- ErrorState não mostra retry sem callback;
- Tag só vira removível quando recebe `onRemove`;
- Button loading bloqueia nova interação.

## Card contract

Não existe Card sem stitched na v1.

```jsx
<Card>...</Card>
```

O checker bloqueia uso direto de `ds-card` fora de `Card.jsx`. A costura usa `CardStitch`, um SVG decorativo sem interação, com cor `--border-subtle` em ambos os temas. Os tokens `--card-stitch-width` (0.125rem), `--card-stitch-dash` (0.375rem) e `--card-stitch-gap` (0.3125rem) controlam o traço sem deformá-lo conforme o tamanho do card.

`Dialog` aceita `size="lg"` para seleção de conteúdo amplo. O cabeçalho fica fora da região rolável; a camada continua usando Portal, bloqueio de rolagem, Escape e retorno de foco.

## Motion contract

- sem `transition: all`;
- blur é permitido como parte de motion funcional;
- layers usam opacity + scale + blur + deslocamento curto;
- rotas usam View Transitions com fallback;
- reduced motion é obrigatório.

## Component Lab

```
#/dev/components
```
