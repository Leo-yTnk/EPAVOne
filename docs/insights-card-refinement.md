# Refino dos cards de receita e produto

Continuação do PR #69, em 25/10/2026.

- Cards usam 24 px de padding no desktop e 16 px no mobile, também na grade expandida. Removidos overrides que reduziam esses valores nas coleções.
- As ações usam Button secundário do Design System, com padding de 12 px na horizontal, área mínima de 44 px, borda, raio interno derivado e seta alinhada. Mantêm nomes acessíveis e callbacks existentes.
- A foto do produto usa moldura quadrada no catálogo, `object-fit: contain` explícito e margem interna de 4–8 px. O mesmo contrato mantém embalagens completas nos detalhes e nas miniaturas de ingredientes. O fundo claro é aplicado apenas quando há imagem; o fallback preserva as cores do tema.
- A fotografia da receita conserva o tratamento de capa. No detalhe desktop, passa de 4:5 a 4:3, com título de até 40 px e alinhamento superior; o conteúdo aproveita melhor a altura disponível. O mobile conserva 16:10. Uma divisão sutil organiza ingredientes e preparo sem criar outros cards internos.

Validação: `npm run verify` aprovado com 353 testes em 77 arquivos, arquitetura e build. Lint final sem erros, com o aviso preexistente em `scripts/review-migration.mjs`. O build foi repetido após o ajuste do fallback de imagem.

Oito cenários Chromium: 320/390/768/1440 px nos temas claro/escuro. Asserções de padding do card e botão, alvo de toque, imagens de embalagem vertical e horizontal, moldura quadrada, preservação do `contain`, expansão no mobile, ausência de overflow, histórico e fechamento do detalhe. Receitas também verificadas com texto ampliado e densidade compacta. Capturas com fotografias de demonstração inspecionadas em mobile e desktop.

Sem dependência nova, migrations ou alteração de dados. As medições de desempenho do reparo anterior permanecem documentadas separadamente; não foi atribuída uma nova medição de CPU a este refino visual.
