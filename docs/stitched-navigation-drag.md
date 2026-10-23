# Hovers e navegação por arraste

`--surface-hover` é separado de `--surface-selected`. O hover mistura 8% da cor de marca com a superfície no tema claro e 12% no escuro; o escuro não usa o antigo tom claro `brand-100`. Navegação, botões secundários/ghost, ícones, menus e opções compartilham o token. A aba ativa conserva a superfície costurada sob o ponteiro.

Abas com `stitchedIndicator` e o indicador costurado das seções permitem arrastar a seleção atual com mouse ou toque. Um deslocamento de 6px distingue o gesto do clique. O indicador acompanha a faixa e interpola suas dimensões entre os alvos habilitados; os próprios botões, o conteúdo e as rotas permanecem na posição original durante o gesto. Só ao soltar o alvo mais próximo é ativado, usando seu callback/link existente e focando o destino. A navegação do header mantém sua animação de largura ao confirmar a mudança.

O gesto começa na aba ativa. Arrastar uma aba inativa não captura a rolagem. O gesto perpendicular continua sendo rolagem nativa (`pan-y` em abas horizontais e `pan-x` nas verticais). Nenhum novo controle visual foi adicionado. Navegação compacta de celular, teclado e cliques comuns mantêm o funcionamento existente.

Escape, pointercancel, perda de captura da faixa, resize, scroll, perda de foco da janela e ocultação da aba cancelam a prévia. A transferência da captura implícita de toque do botão para a faixa não é tratada como cancelamento. Mudanças de orientação ou rota limpam a prévia. O clique nativo posterior ao arraste é suprimido para não reativar a aba anterior. Movimento reduzido preserva a manipulação direta e remove a acomodação animada.

A geometria é medida sem a escala transitória de pressão. Ao iniciar o arraste, o feedback de pressão é cancelado. CSS custom properties próprias da prévia não substituem as medidas canônicas do indicador e são removidas ao concluir/cancelar o gesto.

Validação: `tests/selection-drag.test.jsx` cobre confirmação, clique residual, cancelamento, rolagem perpendicular, limites, desabilitados, transferência de captura e orientação. `scripts/review-selection-drag.mjs` usa Chromium/Playwright para mouse e toque real via CDP, temas claro/escuro, rota estável durante o gesto, alinhamento final, movimento reduzido, contraste do hover e rolagem vertical nativa. Playwright e o executável definido por `REVIEW_BROWSER` são ferramentas de revisão, sem dependência nova de produção.

Verificação final: 322 testes aprovados, arquitetura e build aprovados; revisão do header sem regressões e cenários de mouse, toque e barra lateral aprovados em Chromium. No cenário de hover da aba Writer sob o tema Planner, o fundo escuro medido foi RGB(43,36,49), com contraste de texto de aproximadamente 13,5:1. Não houve validação em iPhone/Safari físico.

A execução sem limite de concorrência atingiu o timeout de inicialização do PGlite em `swift-sync-lifecycle.test.js`. O comando `VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 npm run verify` concluiu toda a suíte sem alterar testes ou timeouts do projeto. O aviso de ESLint em `scripts/review-migration.mjs` já existia.
