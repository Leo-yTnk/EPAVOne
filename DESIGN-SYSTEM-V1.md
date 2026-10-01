# EPAVOne Design System — v1 RC

> Fundação para iniciar a migração do EPAVInsights. A versão só vira **1.0** depois do fluxo piloto real.

## 1. Princípios do produto

1. **Clareza antes de decoração** — indicadores, contexto e próximos passos precisam ser entendidos antes dos ornamentos.
2. **Densidade equilibrada** — bastante informação sem aparência de planilha congestionada.
3. **Hierarquia consistente** — toda página explicita produto, título, contexto, filtros e ação principal.
4. **Movimento funcional e natural** — animações explicam continuidade e mudança de estado sem atrasar tarefas.
5. **Acessibilidade por padrão** — teclado, foco, contraste, feedback e movimento reduzido fazem parte da API.

## 2. Direção visual

### Família visual

- **EPAVOne:** azul;
- **EPAVPlanner:** roxo;
- **EPAVInsights:** laranja;
- **EPAVWriter:** turquesa.

A base é **Warm Paper**, com fundos quentes e contraste confortável.

### Tipografia

- **DM Serif Display:** display/hero;
- **Inter Tight:** headings;
- **Inter:** corpo, labels, controles e dados.

Line-height é deliberadamente compacta:
- display: aproximadamente `0.98`;
- headings: aproximadamente `1.08–1.14`;
- corpo: aproximadamente `1.42`;
- controles/labels: aproximadamente `1.18–1.32`.

### Superfícies

- evitar composição que pareça uma coleção de caixas independentes;
- preferir superfícies contínuas e suspensas;
- **todo Card é stitched**;
- o stitch usa token semântico próprio;
- no dark mode o stitch é apenas levemente mais escuro que a superfície, com baixo contraste;
- nested radius deve ser calculado a partir de radius externo e padding quando superfícies encostam visualmente.

O contrato recomendado é:

```css
--nested-radius: max(
  var(--radius-sm),
  calc(var(--container-radius) - var(--container-padding))
);
```

Esse padrão é obrigatório principalmente em ilhas de navegação e seus controles internos.

## 3. Tokens

### Categorias

- cor;
- tipografia;
- spacing;
- radius;
- elevation;
- controles;
- z-index;
- motion;
- line-height;
- layers;
- temas.

### Radius

O sistema diferencia:
- radius de controles;
- radius de containers;
- radius de cards;
- radius aninhado calculado.

Cards usam radius maior que na primeira RC.

### Motion

Tokens principais:

```css
--duration-instant
--duration-fast
--duration-normal
--duration-slow
--duration-deliberate

--ease-standard
--ease-enter
--ease-exit
--ease-press
--ease-emphasized

--motion-distance-sm
--motion-distance-md
```

## 4. Movimento

Animação faz parte do funcionamento do produto.

### Permitido

Transições podem combinar, quando justificadas:

- `opacity`;
- `transform`;
- cor;
- borda;
- sombra.

Filtros de blur e backdrop-filter são proibidos por custo de renderização. Use opacidade, deslocamento curto e escala sutil, sem atrasar a interação.

### Regras

- não usar `transition: all`;
- movimentos devem ser curtos e previsíveis;
- entrada normalmente usa easing de desaceleração;
- press usa scale sutil;
- página pode combinar opacity + translate;
- layers podem combinar opacity + scale + translate;
- o transform-origin de uma layer ancorada deve partir do trigger;
- `prefers-reduced-motion` remove coreografia e reduz durações;
- nenhuma animação pode atrasar uma ação funcional.

### Navegação

Rotas usam View Transitions quando disponíveis e fallback CSS quando não.

A página:
- sai com opacity/movimento muito curto;
- entra com opacity + translate + scale sutil;
- mantém o header visualmente estável;
- respeita reduced motion.

## 5. Layers e overlays

Existe uma camada compartilhada de portal.

Devem usar portal:
- Select;
- Menu;
- Tooltip;
- Dialog;
- Drawer;
- Toast.

Isso evita clipping por:
- `overflow: hidden`;
- `overflow: clip`;
- transforms;
- stacking contexts da página.

### Select

Existe **um único Select visual** no design system.

Não existe Select nativo público.

O menu:
- é renderizado em portal;
- usa posicionamento fixo calculado a partir do trigger;
- escolhe abrir acima ou abaixo conforme espaço;
- mantém largura coerente com o trigger;
- recalcula em scroll/resize;
- usa transform-origin derivado do trigger;
- anima com opacity + scale + pequeno movimento;
- mantém highlight separado de seleção;
- suporta Arrow Up/Down, Home, End, Enter, Space, Escape e Tab.

## 6. Feedback

“Design is how it works” é regra operacional.

### Loading

- primeiro carregamento: Skeleton;
- ação de botão: Button loading;
- refresh: Spinner discreto;
- nunca deixar ação visualmente congelada sem feedback.

### Empty e error

- EmptyState só exibe ação se existir callback funcional;
- ErrorState só exibe retry se existir callback funcional;
- controles sem comportamento não devem ser renderizados como interativos.

### Modal feedback

Dialog e Drawer:
- usam portal;
- usam focus trap;
- fecham com Escape;
- devolvem foco ao trigger anterior;
- bloqueiam scroll do body;
- fecham ao clicar no backdrop quando permitido pela composição.

### Toast

Toast:
- usa região `aria-live`;
- erro usa role `alert`;
- outros estados usam `status`;
- pode ter dismiss funcional.

## 7. Componentes

### Fundação

- Text;
- Heading;
- Icon;
- Link;
- Stack;
- Inline;
- Container;
- Grid;
- Divider.

### Interação

- Button;
- IconButton;
- Input;
- Textarea;
- Select;
- Option;
- Checkbox;
- Radio;
- Switch;
- Slider;
- Tabs;
- Menu;
- Pagination.

### Estrutura

- Nav / NavItem;
- Breadcrumb;
- Sidebar;
- PageHeader;
- Toolbar;
- FilterBar / FilterControl;
- DateRange;
- Card.

### Dados

- Badge;
- Tag;
- MetricCard;
- DataTable;
- ChartContainer;
- Progress.

### Feedback

- Spinner;
- Skeleton;
- Alert;
- EmptyState;
- ErrorState;
- Dialog;
- Drawer;
- Toast / ToastRegion;
- Tooltip.

## 8. Card contract

`Card` adiciona automaticamente:

```
ds-card
ds-stitched-card
```

Não existe variante pública de Card sem stitched.

MetricCard, DataTable e ChartContainer compõem Card.

## 9. Acessibilidade

- foco visível;
- teclado;
- targets de toque;
- sem dependência exclusiva de cor;
- `aria-current`;
- `aria-live`;
- skip link;
- focus management após navegação;
- reduced motion;
- roles semânticos;
- overlays com focus trap.

## 10. Regras de arquitetura visual

Páginas não podem:
- criar Button/Input/Select/Card/Alert/Dialog/Tabs etc. por classes CSS;
- usar Select nativo;
- criar overlays fora do portal system;
- usar `transition: all`;
- usar `!important`;
- usar prefixo `yc-*`;
- usar line-height acima da faixa compacta definida sem justificativa arquitetural.

Essas regras são verificadas automaticamente por `scripts/check-architecture.mjs`.

## 11. Definição de pronto para v1.0

A RC só vira 1.0 quando o piloto real do EPAVInsights provar:

- shell desktop/mobile;
- rotas profundas;
- light/dark;
- contraste;
- motion/reduced motion;
- filtros;
- Select em cards, drawers e toolbars sem clipping;
- métricas;
- gráficos;
- tabela/lista;
- loading;
- vazio;
- erro;
- teclado;
- feedback;
- regressão visual dos componentes críticos;
- nenhuma exceção CSS específica para “consertar” página.

## 12. Component Lab

`#/dev/components` usa valores fictícios e os componentes reais do design system.

Ele serve para validar:
- visual;
- estados;
- motion;
- layers;
- teclado;
- feedback;
- dark/light;
- radius nesting;
- stitched cards.
