# EPAVOne — Component Catalog

Inventário implementado da Component Foundation. O CSS canônico está em `ds-enforce.css`; a home contém exemplos executáveis com dados fictícios.

| Família | Componente | Estados / variantes |
|---|---|---|
| Typography | Text / Heading | display, h1–h6, body, label, caption, overline |
| Layout | Stack / Inline / Container / Grid / Divider | tokens de gap/spacing |
| Icon | Icon | currentColor, tamanho base |
| Action | Button | primary, secondary, ghost, danger; sm/md/lg; loading/disabled/focus/pressed |
| Action | IconButton | sm/md/lg; hover/focus/pressed/disabled |
| Form | Input | default, helper, error, success, disabled |
| Form | Select nativo | hover/focus/disabled/dark |
| Form | Select + Option | open, selected, highlighted, disabled, keyboard |
| Form | Checkbox | checked/focus/active/disabled |
| Form | Radio | checked/focus/active/disabled |
| Form | Switch | checked/focus/disabled |
| Form | Slider | progress/focus/disabled |
| Navigation | Navigation Island | light/dark |
| Navigation | Nav / NavItem | active/hover/disabled |
| Navigation | Tabs | active/hover/focus/disabled |
| Navigation | Breadcrumb | deep routes |
| Navigation | Sidebar | composed NavItems |
| Structure | PageHeader | title/context/actions |
| Structure | Toolbar | groups/actions |
| Structure | FilterBar | responsive controls |
| Structure | DateRange | start/end |
| Data | Card / Stitched Card | hover/elevation |
| Data | Badge | default/info/success/danger |
| Data | Tag | default/removable |
| Insights | MetricCard | positive/negative/neutral trend |
| Insights | DataTable | header/row hover/numeric |
| Insights | ChartContainer | header/legend/plot |
| Feedback | Spinner | md/lg |
| Feedback | Skeleton | title/line/circle |
| Feedback | Alert | info/success/warning/danger |
| Feedback | EmptyState | icon/copy/action |
| Feedback | ErrorState | danger treatment |
| Feedback | Dialog | modal/actions; showcase adds Escape + focus trap |
| Feedback | Drawer | right panel; showcase adds Escape + focus trap |
| Feedback | Toast | success/error/info + aria-live integration |
| Feedback | Tooltip | hover/focus |

## Keyboard contract

- **Tabs:** arrow keys are supported by the global product tabs; the showcase tabs expose correct roles/states.
- **Select + Option:** Arrow Up/Down, Enter/Space and Escape.
- **Dialog/Drawer:** Escape closes; Tab/Shift+Tab stay inside while open.
- **Tooltip:** visible on hover and focus-within.
- Native form controls preserve native keyboard behavior.

## Motion contract

Animations use component-specific properties and design tokens. `transition: all` is prohibited. Reduced-motion rules remain active.
