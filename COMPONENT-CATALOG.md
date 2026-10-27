# EPAVOne — Component Catalog

`Drawer` aceita `side="start"` para abrir pela esquerda e `className`/`id` para composição. O padrão permanece à direita. A variante mantém Portal, trava de rolagem, Escape, foco contido e retorno de foco.

Os componentes públicos são Preact/JSX e vivem individualmente em `src/design-system/components/`.

## Fundação

| Componente | Responsabilidade |
|---|---|
| Text | corpo tipográfico |
| Heading | heading/display |
| Icon | ícone vetorial |
| AppLogo | família SVG One/Insights/Planner/Writer, com símbolo e wordmark opcional; tamanhos sm/md/lg |
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
| ContextMenu | clique direito, toque prolongado e Shift+F10, sem botão visível; reutiliza Menu e preserva ações nativas em campos e links |
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
- Insights pode usar `Carousel.headingSurface` para apresentar o título e as ações da coleção em Card sem acrescentar artigos à lista. O padrão do Carousel continua sem superfície no cabeçalho.
- Carousel: fileira com rolagem nativa por toque/trackpad, scroll snap, setas e teclado no contêiner (Arrow/Home/End); `expanded` muda para grade, `action` recebe a ação da seção e `headingId` conecta título e região. Sem autoplay, clones ou listeners de arraste. Respeita movimento reduzido.

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

## Presença de modais

`Dialog` e `Drawer` mantêm uma saída visual curta quando `open` passa a falso. A ação de fechar, o foco e a rolagem são liberados imediatamente; a superfície restante é inerte e oculta para tecnologia assistiva. Movimento reduzido remove a retenção.

Quando o componente inteiro é condicional, componha com `ModalPresence` para permitir a saída:

```jsx
<ModalPresence>
  {selected && <RecipeDialog recipe={selected} onClose={() => setSelected(null)} />}
</ModalPresence>
```

O componente deve receber `null`/`false` quando fechado. Reabrir antes de terminar a saída cria uma instância limpa. Portais ancorados dentro do modal são removidos ao começar a saída.

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

Cards independentes são stitched por padrão; imagens e diálogos de leitura do Insights podem usar a exceção funcional sem costura.

```jsx
<Card>...</Card>
```

O checker bloqueia uso direto de `ds-card` fora de `Card.jsx`. A costura usa `CardStitch`, um SVG decorativo sem interação, com cor `--border-subtle` em ambos os temas. Os tokens `--card-stitch-width` (0.125rem), `--card-stitch-dash` (0.375rem) e `--card-stitch-gap` (0.3125rem) controlam o traço sem deformá-lo conforme o tamanho do card.

`Dialog` aceita `size="lg"` para seleção de conteúdo amplo. O cabeçalho fica fora da região rolável; a camada continua usando Portal, bloqueio de rolagem, Escape e retorno de foco.

## Motion contract

- sem `transition: all`;
- blur e backdrop-filter são proibidos;
- layers usam opacity + scale + deslocamento curto;
- rotas usam deslocamento curto sem fade-out/fade-in;
- reduced motion é obrigatório.

## Component Lab

Referência de desenvolvimento: `src/dev/component-lab/ComponentLab.jsx`. Não possui rota na aplicação.


## Layout e movimento leves

O checker impede filtros de blur no CSS. Animações de páginas, menus, diálogos e feedback usam opacidade, deslocamento curto e escala sutil, com `prefers-reduced-motion`. Superfícies de texto são opacas, sem processamento de backdrop.

Os menus respeitam a área visível do `visualViewport`, inclusive com teclado virtual, e agrupam resize/scroll em um único `requestAnimationFrame`, sem renderizar novamente quando a posição não muda. A altura disponível limita todo o seletor; a busca fica fora da região rolável das opções.

Em telas estreitas, o Writer quebra nomes e rótulos por extenso, empilha controles, mantém ações com altura adaptável e limita o popup à largura e altura da viewport. O header permite rolagem interna das abas de produto sem aumentar a largura da página.


`SelectionIndicator` mantém um único destaque montado e anima sua posição e dimensões entre itens com `aria-current`. É usado nas abas de produto e nas etapas do Writer. Recalcula a geometria quando o contêiner ou o item muda de tamanho e respeita movimento reduzido. Conteúdo, menus e diálogos usam deslocamentos de 4–6 px sem ficar transparentes; somente o fundo de bloqueio do modal varia a opacidade.

`SelectionIndicator` aceita `stitched` para compor o destaque com o Card canônico; `Tabs` expõe `stitchedIndicator`. O header usa essa variante ampliada para app/seção, preservando um único indicador por grupo, animação de posição/largura e movimento reduzido.

Movimento compartilhado: pressão com retorno elástico, indicadores com mola, rotas direcionais e expansão do card com acomodação. Contrato e limites: [continuidade de movimento](docs/continuous-motion.md).

`SelectionIndicator` costurado permite arrastar a seleção ativa até outro destino habilitado. `orientation` acompanha o eixo de `Tabs`; seções usam o padrão horizontal. A rota só muda ao soltar, mantendo alvos e layout estáveis durante a prévia. Contrato e testes: [arraste e hovers](docs/stitched-navigation-drag.md).


Geometria contínua: `CardStitch` alterna path SVG n=4 e rect arredondado conforme o suporte CSS a squircle. Configurações usam cabeçalho e controles agrupados, mantendo o Card canônico. [Espaçamento e introdução](docs/squircle-review/README.md).

## Linguagem compartilhada entre apps

O contrato atualizado de tokens, composição, densidade, formulários e evidências está em [Linguagem visual compartilhada](docs/design-system/README.md).

Novos componentes públicos: `SectionHeader`, `FieldGrid`, `ActionGroup` e `SummaryList`. `PageHeader` agora compõe o Card canônico e aceita `product`, ações e conteúdo opcional. `Card` expõe padding compacto/denso; `Button` expõe tamanho compacto, largura total, raio interno e alinhamento entre extremos.

`Input` e `Textarea` geram IDs quando ausentes, usam rótulos explícitos e vinculam ajuda/erro por `aria-describedby`. `Select` também vincula sua ajuda ao gatilho. O estado inválido acompanha a presença do erro.

`FoundationPreview` compara os mesmos componentes em quatro paletas no Component Lab, sem adicionar uma rota pública.

`Tabs` aceita `size="compact"` para fluxos curtos em espaços estreitos. A variante usa `--space-3` no eixo horizontal e preserva alvo mínimo de `--touch-target`, teclado, indicador e movimento reduzido. O padrão dos demais consumidores permanece igual.
