# EPAVInsights — acabamento dos detalhes

Base: `ae676ee` (main, após PR #43).

- Dialog do Design System recebe expansão opcional a partir da geometria do card acionado. Usa transform e opacity em 220 ms, sem blur, sem medir layout durante os frames e sem atrasar a disponibilidade dos controles.
- Exceção visual autorizada: o card externo e os cards individuais de produto mantêm a costura; imagens e cards internos de dados/seções usam `stitched={false}`; os catálogos mantêm a identidade padrão. A exceção está registrada no AGENTS.md.
- Card de origem identificado nos catálogos e nos destaques/oportunidades da Home. Outros dialogs preservam seu comportamento.
- Movimento reduzido e navegadores sem Web Animations preservam a abertura normal; Escape, Portal, contenção e retorno de foco continuam sob useModalLayer.
- Título da receita maior, ao lado da imagem e acima dos dados no desktop; no mobile, permanece antes da imagem. Um único heading identifica o dialog em ambos os layouts.
- Uma linha discreta do Divider do DS separa o título do conteúdo, conforme aprovação final.
- Imagem, título e dados da receita compartilham uma única superfície compacta. Dados com ícones ficam agrupados, sem um card separado para cada informação. Ingredientes e preparo usam dois Cards próximos; dicas ficam dentro do card de preparo. As listas têm espaçamento reduzido e não usam linhas divisórias.
- Cards individuais de produto têm miniatura de 64 px, nome por extenso e uma linha inferior alinhando quantidade e ação. Quando a imagem falta, a miniatura mostra um ícone em vez de texto quebrado em várias linhas. A costura permanece no card de produto.
- A coluna dos dados se adapta em telas estreitas para evitar corte de “Rendimento”. Imagens, textos longos e navegação entre receita/produto mantêm sua organização.

## Validação

`npm run verify`: ESLint, arquitetura, 143 testes em 37 arquivos e build Vite aprovados.

Auditoria de navegador: 320, 390, 768 e 1440 px, light/dark; receitas e produtos, navegação receita → produto → receita, Escape e reduced motion. Sem overflow horizontal nos dialogs ou cards de dados e sem erros JavaScript nos cenários. Ver [results.json](results.json).

Capturas: `recipe-{390,1440}-{light,dark}.png` e `product-{390,1440}-{light,dark}.png`. Desktop light e mobile dark inspecionados visualmente.

As capturas usam respostas controladas do catálogo e mostram o fallback de imagem. Não validam imagens reais, autenticação ou dados de produção. Não houve escrita no banco.

## Reproduzir

Com Playwright disponível e Chromium instalado:

```sh
REVIEW_BROWSER=/caminho/do/chromium node scripts/review-insights-details.mjs
```

O script sobe Vite em 127.0.0.1:5174 e escreve as evidências nesta pasta.
