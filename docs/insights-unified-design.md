# Composição unificada do Insights

Esta revisão adota os mesmos princípios de composição do Planner e do Writer: superfícies Warm Paper costuradas, padding semântico, títulos Inter Tight/DM Serif Display e laranja apenas para identidade, seleção e ações. Não cria uma nova paleta ou muda tokens dos outros apps.

## Páginas públicas

- Home: busca, destinos e categorias reunidos em uma superfície de descoberta; coleções com cabeçalhos próprios e cards compactos.
- Receitas e produtos: cabeçalho de contexto compartilhado, painel de filtros/busca/resultados e seções com navegação explícita; carrossel e grade continuam disponíveis.
- Detalhes: superfície única de leitura, toolbar fixa, fotografia, título, metadados e conteúdo com hierarquia consistente. A entrada continua sem escala/distorção.
- Vazio, erro e carregamento mantêm os componentes e ações do Design System.

## Criação e administração

Cabeçalho compartilhado, navegação da biblioteca lateral no desktop e horizontal no celular, com a rolagem dentro da superfície costurada. Biblioteca, categorias, compartilhamento, solicitações, formulários, prévia, importação, revisão, duplicatas, seções e manutenção usam a mesma escala de títulos, gaps, painéis e ações. A navegação não sobrepõe o conteúdo. Nenhuma mudança no contrato dos serviços ou nas operações do banco.

## Implementação e verificação

`InsightsPageHeader` concentra o contexto das páginas. `insights-design.css` define a composição pública e `creation-design.css` a composição do workspace. `Carousel.headingSurface` é opt-in e usa Card do Design System sem alterar os consumidores existentes. O texto do título continua conectado à região navegável.

- `npm run verify`: lint, arquitetura, testes e build.
- `review-insights-discovery.mjs`: quatro larguras e dois temas, catálogo, detalhes, busca, foco, scroll, toque, expansão e movimento reduzido.
- `review-creation-import.mjs`: três larguras e dois temas, biblioteca, compartilhamento, solicitações, administração, editor, importação/revisão e duplicatas. Geometria da costura e separação entre navegação/conteúdo são verificadas.

Capturas públicas usam amostras do catálogo em respostas simuladas. A revisão autenticada usa fixtures locais e serviços simulados; não valida permissões reais ou escreve no Supabase. Chromium não substitui Safari físico. Não há migrations novas.

Atualização: o catálogo de receitas apresenta todos os resultados em uma grade contínua, sem paginação nem agrupamentos. Busca, filtros e links de seção continuam funcionando. Os títulos das coleções da Home e de produtos ficam diretamente sobre o canvas, sem Card ao redor.
