# Insights organizado por seções

A home abre com busca e atalhos de catálogo, seguida por conteúdo. Foram removidos o hero institucional, o passo a passo de atendimento, o destaque grande e o painel lateral de orientação.

Seções da Home configuradas no catálogo têm prioridade e mantêm seus membros. As demais fileiras são derivadas dos dados: ideias ordenadas por destaque/tempo, receitas até 30 minutos, produtos com preço por quantidade e categorias de produtos/receitas. Seções vazias não aparecem; coleções idênticas não se repetem. A busca considera nomes e categorias de receitas e produtos, com estado vazio e limpeza.

Nas páginas de receitas e produtos, seções configuradas continuam respeitadas. Itens sem associação são agrupados pela categoria real; itens sem categoria continuam acessíveis. Busca, filtros combinados, paginação e detalhes permanecem.

As fileiras usam Carousel do Design System, com rolagem nativa, uma parte do próximo card visível, scroll snap e teclado. Cada seção permite abrir/recolher uma grade. Coleções com um único item usam um card horizontal e não exibem um botão redundante de expansão. Cards menores preservam texto completo, alvo de ação de 44px, preço e avisos. Não há autoplay ou clones, e a preferência local/sistema de movimento reduzido vale para os controles.

Validação: `npm run verify`, testes de Carousel, agrupamento e descoberta; `scripts/review-insights-discovery.mjs` verifica quatro larguras, dois temas, limite de tamanho dos cards, enquadramento e peso dos títulos, expansão, overflow, navegação, teclado, gesto de toque real via CDP, busca da Home e movimento reduzido. As capturas usam uma amostra pública em respostas simuladas, sem escrita remota. Não certificam preços atuais nem Safari físico.
