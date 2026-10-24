# Cantos contínuos, espaçamento e introdução

A revisão usa a árvore `2a4ae610` do main (PR #62), preservando as abas arrastáveis, o header contínuo e a sessão do Writer.

## Geometria

Superfícies HTML e pseudo-elementos usam `corner-shape: squircle` (superelipse n=4), com raios semânticos finitos para ações e navegação. `border-radius` continua definindo a extensão do canto: removê-lo eliminaria a curva. Inputs, botões, cards, ilhas, menus, dialogs, alertas, badges e imagens recebem a mesma família de curvas. Radios, indicadores circulares e spinner preservam sua semântica circular.

O recurso ainda não é universal: navegadores sem suporte ignoram a propriedade e preservam raios arredondados. Não há máscaras, polyfill ou recorte de foco. Referência: [corner-shape, MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape).

A costura usa um path SVG n=4 quando a curva CSS está disponível; o rect arredondado permanece como fallback. O mesmo ResizeObserver compartilhado acompanha os tamanhos. A extensão interna desconta inset, borda e o deslocamento do path. Paths não usam viewBox esticado, preservando o comprimento dos pontos.

Cada Card define padding real e sua variável de geometria juntos. Superfícies próximas às bordas usam `max(0px, raio externo - padding - borda)`, sem um mínimo arbitrário que possa exceder o espaço. As imagens dos detalhes recebem a geometria resolvida no próprio card pai.

## Revisão por família

| Família | Ajuste |
| --- | --- |
| Configurações, todos os sete tipos | Cabeçalho com ícone, título e contexto; controles agrupados; colunas alinhadas no desktop e empilhadas no mobile. Navegação usa o mesmo agrupamento dos demais cards. Switches à direita, texto com largura flexível. |
| Home | Padding canônico também no conteúdo em Grid; costura acompanha a mesma superfície. |
| Planner | Hero, perfil, resumo semanal, painéis e guia com geometria vinculada ao padding; agrupamentos começam no topo. |
| Writer | Upload, dados, resumo e linhas com padding vinculado; anexo compacto tem inset explícito; cabeçalho do upload sem margem redundante. |
| Insights | Home, imagens, ingredientes e painéis dos detalhes com raio interno derivado; costura de contraste segue o mesmo path. |
| Criação/administração | Cards de biblioteca, editor, prévia, importação e operações vinculam padding e geometria; ações têm intervalo próprio; conteúdo alinha no início. |
| Layers | Itens de menu/opções derivam o raio do contêiner em portal; foco permanece visível. |

## Introdução

Mostrada no primeiro acesso à Home, sem bloquear links diretos para outros apps. Explica Planner → Insights → Writer e deixa explícito que o aluno envia o pedido ao suporte. As duas ações encerram a introdução e registram a escolha local. O shell permanece disponível. Configurações → Rever a introdução abre `#/welcome` novamente. Restaurar preferências não reabre a introdução. Se o armazenamento estiver indisponível, concluir continua funcionando na sessão.

## Validação

- `VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 npm run verify`: 326 testes, arquitetura e build aprovados; aviso preexistente de console em `review-migration.mjs`.
- `scripts/review-squircle-spacing.mjs`: 13 rotas em quatro larguras (320, 390, 768 e 1440px), temas claro/escuro; sem overflow horizontal, cards com curva contínua e Configurações alinhadas. Testa entrada, persistência, reabertura, seletor em portal, tema, movimento reduzido, restauração e diálogo da conta.
- Regressão do indicador costurado: mouse, toque CDP, cancelamento, sidebar, tema escuro e movimento reduzido aprovados pelo script existente de arraste.
- Criação/administração: 72 cenários em 320/390/1440px e claro/escuro aprovados, incluindo editor, importação de seis abas, prévia, biblioteca, solicitações, sync pendente e duplicatas.
- Chromium 149 local; catálogo de teste e Planner em demonstração. Capturas não certificam dados reais do Supabase nem Safari/iPhone físico.

## Refinamento após revisão

Cards principais passam de 32px para 48px de raio; variantes explícitas também sobem uma etapa. Padding base passa a 32px no desktop e 24px no mobile/compacto. Variantes de conteúdo que usavam 12–16px passam a pelo menos 24px. Tabelas ganham espaço entre a superfície rolável e a costura; imagens sem texto preservam sua composição. Raios de imagens internas continuam derivados do contêiner.

A navbar retoma cápsulas com raio máximo calculado pela altura real, inclusive no indicador costurado; ela usa o contorno SVG arredondado correspondente. Barras de rolagem são ocultadas no trilho, nas abas e no header lateral, mantendo a rolagem nativa e a navegação por teclado. Cards de seleção ficam fora da regra de padding compacto.

Validação do refinamento: 326 testes aprovados, arquitetura e build aprovados. A revisão em Chromium passa novamente em 104 combinações de rota/largura/tema, além do script de regressão de arraste com mouse e toque. Capturas atualizadas ficam em `docs/card-padding-review` no ambiente de revisão.

A checagem adicional de navbar/tabelas aprovou dez configurações: 320, 390, 768, 1024 e 1440px, cada uma com navegação horizontal e lateral. Verifica cápsulas e contorno correspondente, ausência de scrollbar visível, padding das tabelas e ausência de overflow horizontal.
