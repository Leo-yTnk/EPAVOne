# EPAVOne

Portal do EPAV para **EPAVInsights**, **EPAVPlanner** e **EPAVWriter**.

## Executar

Abra `index.html` em um navegador ou sirva a pasta com um servidor estático.

As rotas usam fragmentos (`#/...`) para continuar funcionando em hospedagem estática sem regras de rewrite. O shell aceita subrotas profundas, por exemplo:

```
#/insights/clientes/123/historico
#/insights/indicadores
#/planner
#/writer
```

## Design system

A fundação do EPAVOne é canônica neste repositório. Ela **não é mais uma cópia a ser sincronizada do Yourcipe**.

- `ds-enforce.css`: tokens primitivos, semânticos e de componentes + primitives reutilizáveis.
- `styles.css`: composição do portal e do shell; não redefine a fundação.
- `DESIGN-SYSTEM-V1.md`: decisões, princípios, arquitetura, escopo e critérios de fechamento.

### Identidade

- EPAVOne + EPAVPlanner: roxo.
- EPAVInsights: laranja.
- EPAVWriter: turquesa.
- Base: Warm Paper.
- Display/editorial: DM Serif Display.
- Hierarquia: Inter Tight.
- Interface e dados: Inter.
- Temas claro e escuro.
- Grid escolar sutil e stitched cards apenas onde ajudam a identidade.
- Superfícies integradas, com elevação discreta; evitar aparência de caixas empilhadas.

As fontes são carregadas por **uma única estratégia** no `index.html` via Google Fonts. O CSS não declara `@font-face` duplicado.

## Movimento

Movimento deve explicar estado e continuidade, nunca atrasar trabalho:

- propriedades preferidas: `opacity` e `transform`;
- sem `transition: all`;
- sem blur de contêiner em transições de página;
- `prefers-reduced-motion` deve continuar funcional;
- duração e easing vêm dos tokens do design system.

## Status da fundação

A fundação está em **v1 RC (release candidate)**. Ela é suficiente para iniciar o fluxo piloto do EPAVInsights.

O rótulo **v1.0** só deve ser congelado depois que a primeira página real do Insights validar em contexto: filtros, métricas, gráficos, tabela/lista, loading, vazio, erro, responsividade e acessibilidade.
