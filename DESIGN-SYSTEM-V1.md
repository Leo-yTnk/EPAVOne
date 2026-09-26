# EPAVOne Design System — v1 RC

> Fundação para iniciar a migração do EPAVInsights. A versão só vira **1.0** depois do fluxo piloto real.

## 1. Princípios do produto

1. **Clareza antes de decoração** — indicadores, contexto e próximos passos precisam ser entendidos antes dos ornamentos.
2. **Densidade equilibrada** — suportar bastante informação sem aparência de planilha congestionada.
3. **Hierarquia consistente** — toda página explicita produto, título, contexto, filtros e ação principal.
4. **Movimento funcional** — movimento comunica mudança de estado; não atrasa tarefa.
5. **Acessibilidade por padrão** — teclado, foco, contraste e movimento reduzido fazem parte da API dos componentes.

Esses princípios têm prioridade sobre preferências pontuais de cor, raio ou animação.

## 2. Direção visual

### Família visual

EPAVOne é a camada compartilhada. Cada produto tem uma cor de identidade sem criar um design system separado:

- **EPAVOne / EPAVPlanner:** roxo;
- **EPAVInsights:** laranja;
- **EPAVWriter:** turquesa.

A base é **Warm Paper**, com fundos quentes, contraste confortável e sensação estudantil/editorial.

### Tipografia

- **DM Serif Display:** display/hero e momentos editoriais.
- **Inter Tight:** headings e hierarquia de interface.
- **Inter:** corpo, labels, controles, dados e tabelas.

O carregamento é centralizado no `index.html`; não há `@font-face` duplicado no CSS.

### Superfícies

- Evitar composição que pareça uma coleção de caixas independentes.
- Preferir superfícies contínuas e suspensas, com separação por espaço, borda e elevação leve.
- Stitched/dashed é assinatura visual, não decoração universal.
- Grid de fundo deve permanecer sutil e nunca competir com dados.

### Temas

Light e dark permanecem suportados por `data-theme="light|dark"`.

Identidade de produto usa `data-product="one|insights|writer"`, permitindo trocar accent sem duplicar componentes.

## 3. Arquitetura de tokens

### Primitivos

Valores sem significado de interface:

```css
--ref-color-one-700
--ref-color-insights-700
--ref-color-writer-700
--space-400
--radius-300
--duration-fast
```

### Semânticos

Função na experiência:

```css
--color-bg-canvas
--color-bg-surface
--color-text-primary
--color-text-muted
--color-action-primary
--color-border-focus
--color-chart-grid
```

Aliases legados como `--surface-primary` e `--text-primary` continuam disponíveis para reduzir custo da migração, mas novos componentes devem preferir a camada semântica.

### Componentes

Usar apenas quando a decisão não puder ser representada de modo claro por um token semântico:

```css
--button-primary-bg
--card-radius
--navigation-active-bg
--navigation-island-height
--navigation-island-bg
--navigation-island-border
--navigation-island-shadow
--navigation-item-hover-bg
--chart-grid-color
```

Ilhas de navegação usam a primitive `.ds-navigation-island`. A altura, a superfície
translúcida, a borda e a elevação pertencem ao design system; composições de produto
não devem empilhar outra superfície sobre a ilha, preservando sua transparência.

### Convenções

- Primitivo: `--ref-<categoria>-<nome>-<escala>`
- Semântico: `--color-<função>-<estado>` ou token semântico equivalente
- Componente: `--<componente>-<parte>-<estado>`

### Escalas fechadas nesta RC

- cores de identidade e feedback;
- tipografia responsiva;
- spacing em base de 4px;
- radius;
- elevation;
- controles 36/44/52px;
- z-index;
- duração e easing;
- light/dark;
- accent por produto.

Breakpoints continuam pertencendo à composição responsiva do shell até o piloto validar se precisam virar tokens globais.

## 4. Estrutura da aplicação

### Navegação global

Tabs no cabeçalho são navegação **entre produtos**, não substituem a navegação interna.

### Rotas profundas

O roteador aceita qualquer profundidade dentro do produto sem desmarcar a tab global:

```
#/insights
#/insights/indicadores
#/insights/clientes/123/historico
```

### EPAVInsights

A navegação interna inicial foi derivada do inventário real do Yourcipe:

- Visão geral;
- Receitas;
- Produtos;
- Indicadores;
- Histórico;
- Perfil.

Novas subrotas podem surgir durante a migração sem alterar o contrato do shell.

### Conta e logout

O shell reserva **Perfil** como destino autenticado. Logout deve ser integrado quando a camada de autenticação do Yourcipe for migrada; não deve ser simulado com estado falso antes disso.

### Breadcrumbs

Rotas profundas usam breadcrumb. O produto global permanece selecionado.

## 5. Componentes

### Fundação

Necessários para o piloto:

- Text / Heading;
- Stack / Inline;
- Container / Grid;
- Divider;
- Icon.

### Interação

- Button / IconButton / Link;
- Input / Select / Checkbox;
- Tabs;
- filtros;
- date range.

### Estrutura

- AppShell;
- PageHeader;
- navegação global e interna;
- Card / Section / Toolbar.

### Feedback

- Skeleton / Spinner;
- EmptyState / ErrorState;
- Alert / Toast;
- Dialog ou Drawer.

### Insights

- MetricCard;
- DataTable;
- chart container;
- tooltip e legenda;
- filtros.

**Regra:** não construir o catálogo inteiro antes da primeira página. O piloto decide quais APIs realmente sobrevivem.

## 6. Movimento

Tokens fechados:

```css
--duration-fast
--duration-normal
--duration-slow
--ease-enter
--ease-exit
--ease-press
```

Regras:

- priorizar `opacity` e `transform`;
- não usar `transition: all`;
- não animar `filter` em contêineres grandes;
- press pode usar scale sutil;
- tabs podem mover indicador;
- dialogs/drawers usam entrada curta e contextual;
- `prefers-reduced-motion` reduz duração e remove coreografias.

## 7. Regras de acessibilidade

- foco visível;
- navegação por teclado;
- targets de controle compatíveis com toque;
- sem dependência exclusiva de cor;
- `aria-current` para navegação ativa;
- live region para mudança de rota;
- skip link;
- reduced motion;
- contraste deve ser revalidado no piloto, inclusive nos gráficos.

## 8. Auditorias estruturais já fechadas

Na fundação v1 RC:

- `transition: all`: **0**;
- `!important`: **0**;
- `@font-face` duplicado: **0**;
- classe de tema `yc-dark`: **0**;
- transição de página com `filter: blur()`: **0**;
- nomenclatura temática centralizada em `data-theme` e `data-product`.

## 9. Definição de pronto para v1.0

Só marcar **1.0** quando o piloto do EPAVInsights provar, em uma página real:

- tokens documentados e suficientes;
- light/dark com contraste validado;
- shell desktop/mobile;
- rotas profundas;
- estados normal, hover, focus, active, disabled e loading dos componentes usados;
- teclado;
- reduced motion;
- loading, vazio e erro;
- filtros;
- cards de métricas;
- gráfico;
- tabela/lista;
- regressão visual dos componentes críticos;
- nenhum CSS criado apenas para “consertar” uma página;
- nenhum componente novo depende do prefixo `yc-*`.

## 10. O que fica deliberadamente fora da RC

- catálogo completo de componentes;
- componentes exclusivos do Planner/Writer;
- coreografias sofisticadas;
- sistema completo de ilustrações;
- todos os tipos de gráfico;
- documentação exaustiva;
- API final de dashboard antes do piloto.

## 11. Próximo passo

Migrar **uma única página representativa do EPAVInsights** para este shell — preferencialmente uma visão geral que combine navegação, filtros, métricas, visualização, lista/tabela e estados de carregamento/erro/vazio.

Essa página é o teste de estresse que decide o congelamento da v1.0.


## 12. Component Foundation implementada

A home do EPAVOne funciona como laboratório visual temporário para validar os componentes antes da migração do EPAVInsights.

### Fundação e layout

- Text / Heading (utilities tipográficas existentes);
- Stack;
- Inline;
- Container;
- Grid;
- Divider;
- Icon.

### Interação

- Button: primary, secondary, ghost, danger; sm/md/lg; hover/focus/pressed/disabled/loading;
- IconButton: sm/md/lg + disabled;
- Link;
- Input: default, helper, error, success, focus, disabled;
- Select nativo;
- Select customizado + Option: selected, hover/highlight, disabled e teclado;
- Checkbox;
- Radio;
- Switch;
- Slider / Range;
- Tabs.

### Navegação e estrutura

- Navigation Island;
- Nav / NavItem;
- Breadcrumb;
- Sidebar;
- PageHeader;
- Toolbar;
- FilterBar;
- DateRange;
- Card / Stitched Card;
- Badge / Tag.

### Feedback

- Spinner;
- Skeleton;
- Alert (info/success/warning/danger);
- EmptyState;
- ErrorState;
- Dialog com Escape e focus trap no showcase;
- Drawer com Escape e focus trap no showcase;
- Toast com região aria-live no showcase;
- Tooltip acessível por hover ou foco.

### Insights

- MetricCard;
- DataTable;
- ChartContainer;
- legenda;
- filtros;
- DateRange.

### Regras preservadas

- sem `transition: all`;
- sem `!important`;
- sem animação de blur em páginas;
- reduced motion;
- light/dark;
- accent por produto.

O Component Lab da home usa somente valores fictícios e existe para inspeção e prova de estresse. Ele não representa a arquitetura final do dashboard.
