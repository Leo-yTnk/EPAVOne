# Revisão de navegabilidade — 28/10/2026

## Ajustes

- As abas Todos os clientes/Oportunidades e as abas de um mesmo perfil compartilham a chave de rolagem. Entrar em outro cliente ou seção continua iniciando a página no topo. O foco principal também não é reposicionado nas trocas internas.
- A navegação do shell só revela os destinos ativos quando muda o app, a seção ou a orientação; mudanças internas do perfil não acionam scrollIntoView no cabeçalho.
- A busca fixa do Writer cobre o padding superior e lateral do contêiner de rolagem, com a mesma superfície opaca do diálogo.
- O trilho horizontal mantém inset lateral zero, independentemente do botão ativo. O padding lateral retirado do contêiner foi transferido aos botões das extremidades, respeitando a escala de cada estado.

## Revisão visual

Inspeção em navegador Chromium na prévia local, viewport desktop:

- Planner em demonstração: carteira, perfil de Bruna e troca Preparar/Combinados com a página rolada. A página permanece na área do perfil; o navegador pode limitar a posição ao fim de um painel mais curto.
- Navbar com One ativo na extremidade esquerda, Writer na direita e Clientes no meio. Medição: padding horizontal do contêiner 0px; inset lateral do trilho 0px; extremidade esquerda do primeiro botão alinhada ao trilho.
- Writer com planilha sintética do helper de testes (25 produtos), lista rolada nos temas claro e escuro. Topo da busca e topo do contêiner coincidem (139,796875px), sem produtos visíveis acima da busca. Fundo opaco confirmado.
- Capturas: [tema claro](writer-search-light.jpg) e [tema escuro](writer-search-dark.jpg).

A prévia HTTP não disponibiliza crypto.randomUUID, usado pelo Writer existente. Para a inspeção foi usado um ponto de entrada temporário com adaptador baseado em crypto.getRandomValues; o arquivo foi removido e não faz parte da alteração. Nenhuma alteração de backend, conta ou dado de produção foi necessária. Viewports móveis não foram inspecionados nesta sessão.

## Validação

`npm run verify`: lint, arquitetura, catálogo de tokens, 98 arquivos de teste / 490 testes e build de produção. Testes de regressão cobrem a chave de rolagem e as trocas reais de abas da carteira e do perfil no App.

## Insights em página única

Removida a paginação das três listagens que ainda a usavam: catálogo público de produtos, EntityManager (receitas, produtos e categorias, nos escopos pessoal e administrativo) e solicitações (usuário e revisão administrativa). Removido também o seletor de itens por página. Receitas, biblioteca compartilhada e demais seções já exibiam suas listas sem paginação. As prateleiras, os filtros e o índice de seções permanecem disponíveis.

Revisão em Chromium desktop com o catálogo público: 1002 produtos carregados e 1002 cards na mesma página, organizados em 23 grupos, sem componente de paginação. Busca por “file frango” retornou 10 produtos. [Captura do catálogo completo](insights-single-page.jpg).

Os testes usam listas acima dos limites anteriores: 60 produtos públicos, 100 itens por tipo e escopo da biblioteca e 45 solicitações em cada modo. Cobrem busca e restauração da lista completa; os testes existentes continuam cobrindo filtros. Consultas internas em lotes permanecem no repositório para evitar truncamento pelo servidor.

Validação final desta atualização: `npm run verify` aprovado, com 98 arquivos / 498 testes e build de produção.
