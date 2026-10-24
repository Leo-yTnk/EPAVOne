# Catálogo e detalhes no celular

Esta revisão substitui a expansão geométrica do diálogo: a janela mantém suas dimensões reais durante toda a entrada. Usa deslocamento vertical de 12px, deslocamento horizontal limitado a 6px conforme a origem e opacidade de 0,8 a 1, em 220ms. Não escala texto nem imagens. Escape, fechar, foco e ações continuam imediatos.

No celular, os detalhes abrem como uma folha encostada à borda inferior, com cantos superiores semânticos, área de rolagem própria e barra de voltar/fechar fora da rolagem. Receita e produto usam uma única superfície sem costura. Os cards independentes do catálogo mantêm a costura. Produtos relacionados e ingredientes são listas sem caixas aninhadas.

Receitas têm foto ampla, categoria discreta, nome, metadados e ação. Produtos têm miniatura, nome, preço e ação em um card compacto. Preço por quantidade, confirmação de referência e peso variável são preservados. As imagens são posicionadas dentro da caixa com proporção definida, evitando o corte involuntário causado pelo tamanho intrínseco da foto.

A troca de apps combina deslocamento direcional e opacidade. Quando há carregamento adiado do módulo, a animação espera o conteúdo real aparecer; trocar novamente cancela a observação anterior. O Writer permanece montado e preserva os dados. O rótulo de contexto mobile e a primeira chegada da coleção também têm movimentos curtos, sem animação por item ou loops novos. A navegação por seções respeita também a preferência local de reduzir movimento.

## Validação

- `npm run verify`: testes, lint, arquitetura e build.
- `tests/route-motion.test.jsx`: carregamento adiado, troca abandonada, preferência reduzida, direção e cancelamento.
- `tests/dialog-expansion.test.jsx`: entrada limitada sem escala, toque sem foco, fechamento e retorno de foco.
- `tests/insights-detail-navigation.test.jsx`: histórico receita/produto/receita e leitura em superfície única.
- `scripts/review-mobile-catalog.mjs`: 320, 390, 768 e 1440px, claro e escuro; 16 cenários de catálogo/detalhes, fotos dentro das caixas, ações de pelo menos 44px, ausência de overflow, barra fixa, foco, direção, troca dos apps e movimento reduzido.

O script aceita `REVIEW_BROWSER`, `REVIEW_OUTPUT` e, opcionalmente, `REVIEW_FIXTURE_DIR` com `products.json`, `recipes.json` e fotos numeradas. As capturas usam uma amostra pública do catálogo em respostas simuladas, com relações de ingredientes controladas para teste; não certificam preços atuais nem alteram o banco. Sem fotos locais, usa os estados de imagem indisponível. Chromium não substitui verificação em Safari físico.
