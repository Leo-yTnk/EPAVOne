# Revisão visual e funcional — 6 de outubro de 2026

Base: `ffdf735` (main, após PR #42). Escopo: acabamento do EPAVOne existente, sem criar funcionalidades de produto.

## Resultado

- Identidade centralizada: One `#4F6FD8`, Planner `#7657D6`, Insights `#D96B32`, Writer `#219B94`. Tons acessíveis para texto e botões; aliases semânticos também se resolvem nos produtos aninhados da Home.
- Home apresenta o fluxo Insights → Planner → Writer em uma sequência de Cards stitched, sem separadores por linhas sobre o quadriculado. Planner comunica seu estado de desenvolvimento e oferece próximos passos reais.
- Configurações é uma lista estruturada de Cards stitched, com feedback de persistência e informação correta quando o armazenamento local está indisponível.
- Header horizontal ocupa 100% da largura, com conteúdo alinhado às margens da página; a matriz verifica sua geometria em todas as 80 combinações. Insights agrupa destaque, exploração e orientações em Cards; separação editorial usa espaçamento.
- Animações existentes permanecem curtas: rotas deslocam até 6 px em 220 ms, layers até 4 px em 220 ms e press responde em 150 ms. Sem coreografia adicional por Card, blur ou `transition: all`; reduced motion preservado.
- Tabs compartilham um único SelectionIndicator persistente. Portal, teclado, retorno de foco e movimento reduzido foram preservados.
- Insights usa skeletons na primeira carga, elimina contagens redundantes e consolida as regras de composição editorial. Criação elimina superfícies de Card onde o conteúdo é uma lista ou página.
- Writer preserva o formulário, cliente, etapa e carrinho se a validação de um arquivo substituto falhar. Erros de exportação e edição informam o que foi preservado e como tentar novamente.
- DM Serif Display, Inter e Inter Tight são servidas localmente em WOFF2, com as licenças OFL originais. A tipografia não depende de Google Fonts em tempo de execução.
- Contraste dos textos secundários e do turquesa acessível ajustado nos tokens do Design System.

## Evidências

Os JSONs desta pasta registram as verificações executadas. As capturas de Insights usam **dados controlados**, com imagens ausentes para validar o fallback. As capturas de Writer usam um **Excel sintético** do helper de testes; não contêm dados pessoais de clientes reais.

| Verificação                                                                                                                                 | Evidência                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 320, 390, 768, 1024 e 1440 px; light/dark; 8 rotas                                                                                          | [matrix-results.json](matrix-results.json)                                                                   |
| Busca, vazio, reset, paginação, detalhes, Escape, retorno de foco, retry, skeleton, Portal, navegação vertical, reduced motion e exportação | [browser-results.json](browser-results.json)                                                                 |
| 32 auditorias WCAG 2 A/AA e 2.1 AA, light/dark, sem violações detectadas                                                                                                 | [accessibility-results.json](accessibility-results.json)                                                     |
| Animações curtas, opacidade da página preservada, ausência de blur e backdrop-filter | [motion-results.json](motion-results.json) |
| Home desktop                                                                                                                                | [home-1440-light.png](home-1440-light.png)                                                                   |
| Insights desktop | [insights-1440-light.png](insights-1440-light.png) |
| Configurações desktop | [settings-1440-light.png](settings-1440-light.png) |
| Configurações mobile                                                                                                                        | [settings-390-dark.png](settings-390-dark.png)                                                               |
| Navegação vertical                                                                                                                          | [settings-vertical-desktop.png](settings-vertical-desktop.png)                                               |
| Carrinho e conferência                                                                                                                      | [writer-cart-mobile.png](writer-cart-mobile.png), [writer-review-mobile.png](writer-review-mobile.png)       |
| Detalhes de produto e receita                                                                                                               | [product-detail-mobile.png](product-detail-mobile.png), [recipe-detail-mobile.png](recipe-detail-mobile.png) |
| Erro e carregamento                                                                                                                         | [catalog-error-mobile.png](catalog-error-mobile.png), [home-loading-mobile.png](home-loading-mobile.png)     |

`npm run verify`: ESLint, arquitetura, 139 testes em 36 arquivos e build Vite aprovados. Novos testes cobrem preservação do pedido durante/finalizando uma troca inválida, indicador persistente e indisponibilidade de armazenamento.

A inspeção visual também verificou alinhamento, sobreposições, largura do carrinho, tipografia carregada e superfícies nos prints. A auditoria automatizada não substitui uma avaliação humana completa de acessibilidade.

## Limites de validação

O acesso externo ao Supabase falhou neste ambiente; o diagnóstico está em [live-catalog-access-error-diagnostic.png](live-catalog-access-error-diagnostic.png). Isso não demonstra uma falha do banco em produção. O navegador validou a aplicação com respostas controladas; não houve login real nem escrita no banco. Editor, colaboração, administração, importação, permissões SQL e sessão foram verificados pela suíte existente, com mocks/banco local quando aplicável. A validação do catálogo, imagens e operações autenticadas com dados reais permanece necessária no ambiente publicado.

## Reprodução

Execute `npm run verify`. Para repetir o audit de navegador, instale opcionalmente `playwright` e `@axe-core/playwright` no ambiente de desenvolvimento, disponibilize um Chromium e execute `REVIEW_BROWSER=/caminho/do/chromium node scripts/review-browser.mjs`. O script serve o build em `127.0.0.1:5174` e escreve as evidências nesta pasta. O Excel sintético usa a semana de 05–10/10/2026; em outra semana, ajuste o período e a data de retirada do cenário.
