# EPAVInsights — revisão de apresentação e registro de validação

Data: 7 de outubro de 2026. Base: `69684266ad6a49d4a3979921b81dc879bb047e29` (PR #44).

## Diagnóstico

A lacuna principal era a pouca continuidade entre descobrir uma receita, escolher os ingredientes e preparar o pedido. O conteúdo já existia; a composição destacava consultas isoladas e contagens, sem tornar essa relação suficientemente visível.

| Área                 | Identificação                                                                                    | Alteração realizada                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home — abertura      | Título e CTA isolados de uma faixa de contagens, com pouca indicação do próximo passo.           | Caminho Inspire → Combine → Prepare o pedido junto à abertura, com links funcionais e contagens reais. O atalho do Writer abre o app; não transfere ingredientes automaticamente.      |
| Home — destaque      | Receita apresentada sem mostrar sua relação com os produtos.                                     | Até três ingredientes vinculados aparecem no próprio destaque, com imagem e abertura de detalhes do produto. Carregamento, erro e ausência de ingredientes têm tratamento explícito.   |
| Home — seções        | Uma grade dimensionada para muitos itens recebia apenas três; a lateral permanecia vazia.        | Seções passaram à coluna principal, com três colunas deliberadas no desktop e listas compactas no celular. Categorias e orientação ficam ao lado das seções.                           |
| Tipografia da Home   | A regra genérica de Heading podia vencer a tipografia display.                                   | Regra de composição garante DM Serif Display no título principal, mantendo Inter/Inter Tight no restante.                                                                              |
| Receitas             | A busca exigia que o vendedor já soubesse o que procurar.                                        | Escolha rápida por tempo disponível, com contagens, estado pressionado e sincronização com o filtro avançado. Busca, categoria, seção e paginação foram mantidas.                      |
| Produtos             | Categorias e oportunidade por quantidade dependiam de abrir/entender os filtros.                 | Categorias presentes no catálogo ganham atalhos com contagens; preço por quantidade aparece quando há produtos que realmente atendem à condição. Sem inventar disponibilidade semanal. |
| Detalhes do produto  | Imagem, preços, orientação e receitas relacionadas pareciam unidades desconectadas.              | Resumo e receitas relacionadas agrupados em Cards discretos, alinhados ao tratamento dos detalhes da receita.                                                                          |
| Detalhes da receita  | A revisão anterior já havia agrupado título, dados, ingredientes e preparo.                      | Composição e separador autorizado foram preservados. A correção de costura também protege os Cards que crescem ao carregar ingredientes.                                               |
| Criação — entrada    | A tela explicava o login, mas pouco o valor da biblioteca.                                       | Introdução com três capacidades: criar, compartilhar e solicitar publicação; botão de login existente mantido.                                                                         |
| Criação — biblioteca | Listas e navegação dependiam de separadores e identificação apenas textual.                      | Registros passam a usar o Card do design system; navegação recebe ícones. Ações, status, busca e paginação permanecem.                                                                 |
| Costura dinâmica     | O retângulo SVG podia conservar a altura anterior após conteúdo assíncrono, atravessando o card. | ResizeObserver mantém as dimensões da costura em sincronia e é desconectado ao desmontar. Há teste para crescimento e limpeza.                                                         |

## Diretrizes preservadas

Warm Paper, canvas quadriculado, laranja do Insights, DM Serif Display, Inter/Inter Tight e componentes do design system. Costuras continuam nos contêineres e imagens do catálogo, no dialog externo e nos produtos da receita. Superfícies internas de detalhe seguem a exceção discreta existente. Nenhuma animação com blur ou backdrop-filter foi adicionada; a expansão e a navegação existentes foram preservadas.

## Validação técnica

`npm run verify` passou: ESLint, verificação de arquitetura, 37 arquivos de testes com 147 testes aprovados e build de produção.

Novos testes verificam:

- atalho de receitas rápidas combinado com busca, sincronização do checkbox e limpeza de filtros;
- categoria, preço por quantidade e busca de produtos combinados;
- abertura de produto pelo destaque da Home e link para o Writer;
- ajuste da costura após crescimento do Card e limpeza do ResizeObserver.

## Validação em navegador

Home, Receitas, Produtos e entrada da Criação foram renderizados em larguras de 320, 390, 768 e 1440 px. Modo escuro foi verificado em 390 e 1440 px. São 24 combinações de página, tema e largura. Não foi observado overflow horizontal nem erro JavaScript nas execuções registradas.

Nos detalhes de receita e produto, em tablet, tela estreita e modo escuro, foram conferidos enquadramento no viewport, fechamento por Escape e retorno de foco ao botão de origem. Movimento normal e reduzido foram usados nas verificações.

Screenshots documentam as quatro páginas em desktop e celular, modos claro e escuro, detalhes de receita/produto e a versão anterior para comparação.

## Limites da verificação

Este é um registro de verificação interna, não uma certificação externa nem garantia de ausência de todos os defeitos.

As capturas usam cópias dos dados públicos consultados em 6 de outubro: 82 receitas, 186 produtos, 11 categorias e sua estrutura de seções. As respostas são servidas ao navegador de teste para contornar falhas de conectividade desse ambiente; isso valida apresentação e interação, mas não certifica a conexão em produção. Preços continuam exigindo confirmação no formulário semanal.

A entrada pública da Criação foi inspecionada visualmente. Biblioteca autenticada, compartilhamento, solicitações e administração foram conferidos por código e pela suíte existente; não foi realizada uma sessão visual autenticada real nem escrita no banco.

Duas imagens externas do catálogo retornaram HTTP 404: Moqueca de Camarão e Sanduíche de Pernil. O fallback foi preservado; os links de origem ainda precisam de substituição editorial.

## Resultado

A apresentação passou a explicar uma sequência de atendimento e a aproximar receitas, produtos e ações úteis. O código verificado e os screenshots estão prontos para revisão. O código verificado está disponível na branch de revisão. O site publicado receberá as alterações somente após integração e implantação.
